import "server-only";
import { cache } from "react";
import { getSession } from "./auth";
import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
import { db } from "./db";
import { eq, and, sql, count } from "drizzle-orm";
import * as schema from "./schema";
import { z } from "zod";

/**
 * Returns null when not logged in. If you want to ensure that the user is logged in, use `ensureUser` instead.
 */
export const getUser = cache(async () => {
  const session = await getSession();
  if (!session) {
    return null;
  }

  if (!session.user) {
    throw new Error("Invalid session");
  }

  const token = decodeJwt(session.user.accessJwt);

  if (!token.sub) {
    throw new Error("Invalid token. Missing sub");
  }

  const pdsUrl = await getPdsUrl(token.sub);
  if (!pdsUrl) {
    throw new Error("No AtprotoPersonalDataServer service found");
  }

  return {
    handle: session.user.name,
    pdsUrl,
    did: token.sub,
    accessJwt: session.user.accessJwt,
  };
});

export async function ensureUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

type PostInput = {
  title: string;
  url: string;
};

export class PdsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export async function createPost({ title, url }: PostInput) {
  await ensureIsInBeta();

  await atprotoCreateRecord({
    record: { title, url, createdAt: new Date().toISOString() },
    collection: "fyi.unravel.frontpage.post",
  });
}

type CreateRecordInput = {
  record: unknown;
  collection: string;
};

async function atprotoCreateRecord({ record, collection }: CreateRecordInput) {
  const user = await ensureUser();
  const pdsUrl = new URL(user.pdsUrl);
  pdsUrl.pathname = "/xrpc/com.atproto.repo.createRecord";

  const response = await fetch(pdsUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.accessJwt}`,
    },
    body: JSON.stringify({
      repo: user.did,
      collection,
      validate: false,
      record: record,
    }),
  });

  if (!response.ok) {
    throw new PdsError("Failed to create post", { cause: response });
  }
}

export const ensureIsInBeta = cache(async () => {
  const user = await ensureUser();

  if (
    await db.query.BetaUser.findFirst({
      where: eq(schema.BetaUser.did, user.did),
    })
  ) {
    return;
  }

  redirect("/invite-only");
});

export const getPlcDoc = cache(async (did: string) => {
  const response = await fetch(`https://plc.directory/${did}`, {
    next: {
      // TODO: Also revalidate this when we receive an identity change event
      // That would allow us to extend the revalidation time to 1 day
      revalidate: 60 * 60, // 1 hour
    },
  });

  return PlcDocument.parse(await response.json());
});

const PlcDocument = z.object({
  id: z.string(),
  alsoKnownAs: z.array(z.string()),
  service: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      serviceEndpoint: z.string(),
    }),
  ),
});

export const getPdsUrl = cache(async (did: string) => {
  const plc = await getPlcDoc(did);

  return (
    plc.service.find((s) => s.type === "AtprotoPersonalDataServer")
      ?.serviceEndpoint ?? null
  );
});

export const getFrontpagePosts = cache(async () => {
  const user = await getUser();

  // const comments = db
  //   .select({
  //     commentCount: sql`COUNT(*)`.as("commentCount"),
  //   })
  //   .from(schema.Comment)
  //   .groupBy(schema.Comment.postId)
  //   .as("comment");

  const result = await db
    .select()
    .from(schema.Post)
    .leftJoin(
      schema.PostVote,
      user
        ? and(
            eq(schema.PostVote.postId, schema.Post.id),
            eq(schema.PostVote.authorDid, user.did),
          )
        : sql`false`,
    );
  // .leftJoin(comments, eq(schema.Comment.postId, schema.Post.id));

  return result.map((join) => ({
    ...join.posts,
    hasVoted: !!join.post_votes,
    commentCount: join.comment?.commentCount,
  }));
});

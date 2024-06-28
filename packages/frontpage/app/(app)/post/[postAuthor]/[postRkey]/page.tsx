import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { NewComment } from "./_comment";
import { Comment } from "./_commentServer";
import { getCommentsForPost } from "@/lib/data/db/comment";
import { getPost } from "@/lib/data/db/post";
import { notFound } from "next/navigation";
import { getDidFromHandleOrDid } from "@/lib/data/atproto/did";
import { Metadata } from "next";
import { getVerifiedHandle } from "@/lib/data/user";

type Params = {
  postAuthor: string;
  postRkey: string;
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const authorDid = await getDidFromHandleOrDid(params.postAuthor);
  if (!authorDid) {
    notFound();
  }
  const post = await getPost(authorDid, params.postRkey);
  if (!post) {
    notFound();
  }

  const handle = await getVerifiedHandle(post.authorDid);
  const path = `/post/${params.postAuthor}/${params.postRkey}`;

  return {
    title: post.title,
    openGraph: {
      title: post.title,
      description: "Discuss this post on Frontpage.",
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: [`@${handle}`],
      url: `https://frontpage.fyi${path}`,
      images: [
        {
          url: `${path}/og-image`,
        },
      ],
    },
  };
}

export default async function Post({ params }: { params: Params }) {
  const authorDid = await getDidFromHandleOrDid(params.postAuthor);
  if (!authorDid) {
    notFound();
  }
  const post = await getPost(authorDid, params.postRkey);
  if (!post) {
    notFound();
  }
  const comments = await getCommentsForPost(post.id);

  return (
    <>
      {post.status === "live" ? (
        <NewComment postRkey={post.rkey} postAuthorDid={authorDid} />
      ) : (
        <Alert>
          <AlertTitle>This post has been deleted</AlertTitle>
          <AlertDescription>
            Deleted posts cannot receive new comments.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6">
        {comments.map((comment) => (
          <Comment
            isUpvoted={comment.userHasVoted}
            key={comment.id}
            cid={comment.cid}
            rkey={comment.rkey}
            postRkey={post.rkey}
            authorDid={comment.authorDid}
            postAuthorParam={params.postAuthor}
            createdAt={comment.createdAt}
            id={comment.id}
            comment={comment.body}
            childComments={comment.children}
          />
        ))}
      </div>
    </>
  );
}

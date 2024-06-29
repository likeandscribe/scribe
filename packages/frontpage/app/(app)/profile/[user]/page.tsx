import { DID, getDidFromHandleOrDid } from "@/lib/data/atproto/did";
import { getUserPosts } from "@/lib/data/db/post";
import { unstable_noStore } from "next/cache";
import { notFound } from "next/navigation";
import { PostCard } from "../../_components/post-card";
import { UserAvatar } from "@/lib/components/user-avatar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/lib/components/ui/tabs";
import { getBlueskyProfile } from "@/lib/data/user";
import { getUserComments } from "@/lib/data/db/comment";
import { Comment } from "../../post/[postAuthor]/[postRkey]/_lib/comment";
import { Suspense } from "react";

type Params = {
  user: string;
};

export default async function Profile({ params }: { params: Params }) {
  const did = await getDidFromHandleOrDid(params.user);
  if (!did) {
    notFound();
  }
  const userPosts = await getUserPosts(did);
  const userComments = await getUserComments(did);

  const overview = [
    ...userPosts.map((p) => ({ ...p, type: "post" as const })),
    ...userComments.map((p) => ({ ...p, type: "comment" as const })),
  ].sort((a, b) => {
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const bskyProfile = await getBlueskyProfile(did);
  if (!bskyProfile) {
    notFound();
  }

  unstable_noStore();

  return (
    <>
      <div className="flex items-center space-x-4 mb-4">
        <UserAvatar did={did} size="medium" />
        <h1 className="text-2xl font-bold">{bskyProfile.handle}</h1>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="flex flex-col gap-4">
            {overview.map((entity) => {
              if (entity.type === "post") {
                return (
                  <PostCard
                    key={entity.id}
                    author={entity.authorDid}
                    createdAt={entity.createdAt}
                    id={entity.id}
                    title={entity.title}
                    url={entity.url}
                    votes={entity.voteCount}
                    commentCount={entity.commentCount}
                    cid={entity.cid}
                    rkey={entity.rkey}
                    isUpvoted={entity.userHasVoted}
                  />
                );
              }
              if (entity.type === "comment") {
                return (
                  <Comment
                    comment={entity.body}
                    isUpvoted
                    rkey={entity.rkey}
                    cid={entity.cid}
                    id={entity.id}
                    key={entity.id}
                    level={1}
                    postRkey={entity.postRkey as string}
                    authorDid={entity.authorDid}
                    createdAt={entity.createdAt}
                    childComments={[]}
                    postAuthorParam={entity.postAuthorDid as DID}
                  />
                );
              }
            })}
          </div>
        </TabsContent>
        <TabsContent value="posts">
          <Suspense>
            <div className="flex flex-col gap-4">
              {userPosts.map((post) => {
                return (
                  <PostCard
                    key={post.id}
                    author={post.authorDid}
                    createdAt={post.createdAt}
                    id={post.id}
                    title={post.title}
                    url={post.url}
                    votes={post.voteCount}
                    commentCount={post.commentCount}
                    cid={post.cid}
                    rkey={post.rkey}
                    isUpvoted={post.userHasVoted}
                  />
                );
              })}
            </div>
          </Suspense>
        </TabsContent>
        <TabsContent value="comments">
          <Suspense>
            <div className="flex flex-col gap-4">
              {userComments.map((comment) => {
                return (
                  <Comment
                    comment={comment.body}
                    isUpvoted
                    rkey={comment.rkey}
                    cid={comment.cid}
                    id={comment.id}
                    key={comment.id}
                    level={1}
                    postRkey={comment.postRkey as string}
                    authorDid={comment.authorDid}
                    createdAt={comment.createdAt}
                    childComments={[]}
                    postAuthorParam={comment.postAuthorDid as DID}
                  />
                );
              })}
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </>
  );
}

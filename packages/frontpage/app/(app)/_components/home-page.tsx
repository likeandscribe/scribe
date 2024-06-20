import { getFrontpagePosts } from "@/lib/data";
import { PostCard } from "./post-card";

export async function Home() {
  const posts = await getFrontpagePosts();
  return (
    <div className="space-y-6">
      {posts.map((post) => (
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
      ))}
    </div>
  );
}

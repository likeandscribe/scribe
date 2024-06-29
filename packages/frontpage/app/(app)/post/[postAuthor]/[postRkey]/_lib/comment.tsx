import { getUser, getVerifiedHandle } from "@/lib/data/user";
import {
  CommentClientWrapperWithToolbar,
  CommentProps,
} from "./comment-client";
import { getCommentsForPost } from "@/lib/data/db/comment";
import { TimeAgo } from "@/lib/components/time-ago";
import { UserAvatar } from "@/lib/components/user-avatar";
import Link from "next/link";
import { getDidFromHandleOrDid } from "@/lib/data/atproto/did";
import { UserHoverCard } from "@/lib/components/user-hover-card";

type ServerCommentProps = Omit<
  CommentProps,
  // Client only props
  | "voteAction"
  | "unvoteAction"
  | "initialVoteState"
  | "hasAuthored"
  | "children"
  | "postAuthorDid"
> & {
  // Server only props
  cid: string;
  isUpvoted: boolean;
  childComments: Awaited<ReturnType<typeof getCommentsForPost>>;
  comment: string;
  createdAt: Date;
  postAuthorParam: string;
};

export async function Comment({
  authorDid,
  isUpvoted,
  childComments,
  comment,
  createdAt,
  postAuthorParam,
  ...props
}: ServerCommentProps) {
  const [postAuthorDid, handle] = await Promise.all([
    getDidFromHandleOrDid(postAuthorParam),
    getVerifiedHandle(authorDid),
  ]);

  if (!postAuthorDid) {
    // This should never happen because we resolve this in the post page
    throw new Error("Post author not found");
  }

  const user = await getUser();
  const hasAuthored = user?.did === authorDid;

  return (
    <>
      <CommentClientWrapperWithToolbar
        {...props}
        hasAuthored={hasAuthored}
        authorDid={authorDid}
        postAuthorDid={postAuthorDid}
        initialVoteState={
          hasAuthored ? "authored" : isUpvoted ? "voted" : "unvoted"
        }
      >
        <div className="flex items-center gap-2">
          <UserHoverCard asChild did={authorDid}>
            <Link
              href={`/profile/${handle}`}
              className="flex items-center gap-2"
            >
              <UserAvatar did={authorDid} />
              <div className="font-medium">{handle}</div>
            </Link>
          </UserHoverCard>
          <Link
            href={`/post/${postAuthorParam}/${props.postRkey}/${handle}/${props.rkey}`}
            className="text-gray-500 text-xs dark:text-gray-400 hover:underline"
          >
            <TimeAgo createdAt={createdAt} side="bottom" />
          </Link>
        </div>
        <div className="prose prose-stone">
          <p>{comment}</p>
        </div>
      </CommentClientWrapperWithToolbar>

      {childComments?.map((comment) => (
        <Comment
          key={comment.id}
          id={comment.id}
          cid={comment.cid}
          rkey={comment.rkey}
          postRkey={props.postRkey}
          authorDid={comment.authorDid}
          comment={comment.body}
          createdAt={comment.createdAt}
          childComments={comment.children}
          isUpvoted={comment.userHasVoted}
          postAuthorParam={postAuthorParam}
          // TODO: Show deeper levels behind a parent permalink. For now we just show them all at the max level
          level={Math.min((props.level ?? 0) + 1, 3) as CommentProps["level"]}
        />
      ))}
    </>
  );
}

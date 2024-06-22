"use client";
import { TimeAgo } from "@/lib/components/time-ago";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/lib/components/ui/alert-dialog";
import { Button } from "@/lib/components/ui/button";
import { Textarea } from "@/lib/components/ui/textarea";
import { SimpleTooltip } from "@/lib/components/ui/tooltip";
import { useToast } from "@/lib/components/ui/use-toast";
import {
  commentUnvoteAction,
  commentVoteAction,
  createCommentAction,
  deleteCommentAction,
} from "./_actions";
import { ChatBubbleIcon, TrashIcon } from "@radix-ui/react-icons";
import { VariantProps, cva } from "class-variance-authority";
import React, { useActionState, useRef, useState, useId } from "react";
import { VoteButton, VoteButtonState } from "../../_components/vote-button";
import { Spinner } from "@/lib/components/ui/spinner";

const commentVariants = cva(undefined, {
  variants: {
    level: {
      0: "",
      1: "pl-8",
      2: "pl-16",
      3: "pl-24",
    },
  },
  defaultVariants: {
    level: 0,
  },
});

export type CommentProps = VariantProps<typeof commentVariants> & {
  rkey: string;
  cid: string;
  id: number;
  postRkey: string;
  author: string;
  comment: string;
  createdAt: Date;
  initialVoteState: VoteButtonState;
  hasAuthored: boolean;
};

export function CommentClient({
  id,
  rkey,
  cid,
  postRkey,
  author,
  comment,
  level,
  createdAt,
  initialVoteState,
  hasAuthored,
}: CommentProps) {
  const [showNewComment, setShowNewComment] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);
  const newCommentTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  return (
    <article className={commentVariants({ level })}>
      <div className="grid gap-2 flex-1 p-1" tabIndex={0} ref={commentRef}>
        <div className="flex items-center gap-2">
          <div className="font-medium">{author}</div>
          <div className="text-gray-500 text-xs dark:text-gray-400">
            <TimeAgo createdAt={createdAt} side="bottom" />
          </div>
        </div>
        <div className="prose prose-stone">
          <p>{comment}</p>
        </div>
        <div className="flex items-center gap-4">
          <SimpleTooltip content="Vote" side="bottom">
            <VoteButton
              initialState={initialVoteState}
              voteAction={commentVoteAction.bind(null, {
                cid,
                rkey,
              })}
              unvoteAction={commentUnvoteAction.bind(null, id)}
            />
          </SimpleTooltip>
          <SimpleTooltip content="Comment" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => !hasAuthored && setShowNewComment(true)}
              disabled={hasAuthored}
            >
              <ChatBubbleIcon className="w-4 h-4" />
              <span className="sr-only">Reply</span>
            </Button>
          </SimpleTooltip>
          {hasAuthored && <DeleteCommentButton rkey={rkey} />}
        </div>
      </div>
      {showNewComment && (
        <NewComment
          textAreaRef={newCommentTextAreaRef}
          parentRkey={rkey}
          postRkey={postRkey}
          autoFocus
          extraButton={
            <AlertDialog>
              <SimpleTooltip content="Discard comment">
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                      if (newCommentTextAreaRef.current?.value.trim() === "") {
                        event.preventDefault();
                        commentRef.current?.focus();
                        setShowNewComment(false);
                      }
                    }}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
              </SimpleTooltip>
              <AlertDialogContent
                onCloseAutoFocus={() => {
                  commentRef.current?.focus();
                }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will discard your comment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowNewComment(false);
                      toast({
                        title: "Comment discarded",
                        type: "foreground",
                      });
                    }}
                  >
                    Discard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />
      )}
    </article>
  );
}

function DeleteCommentButton({ rkey }: { rkey: string }) {
  const [_, deleteAction, isDeletePending] = useActionState(
    deleteCommentAction.bind(null, rkey),
    undefined,
  );
  const { toast } = useToast();

  return (
    <form
      action={deleteAction}
      onSubmit={async (e) => {
        // Prevent default form submission
        // Action is dispatched on dialog action
        e.preventDefault();
      }}
    >
      <AlertDialog>
        <SimpleTooltip content="Delete">
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost-destructive"
              size="icon"
              disabled={isDeletePending}
            >
              <TrashIcon className="w-4 h-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
        </SimpleTooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete your comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteAction();
                toast({
                  title: "Comment will be deleted shortly",
                  type: "foreground",
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

export function NewComment({
  autoFocus = false,
  parentRkey,
  postRkey,
  extraButton,
  textAreaRef,
}: {
  parentRkey?: string;
  postRkey: string;
  autoFocus?: boolean;
  extraButton?: React.ReactNode;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
}) {
  const [_, action, isPending] = useActionState(
    createCommentAction.bind(null, { parentRkey, postRkey }),
    undefined,
  );
  const id = useId();
  const textAreaId = `${id}-comment`;

  return (
    <form
      action={action}
      className="flex items-center gap-2"
      aria-busy={isPending}
      onKeyDown={(event) => {
        const isCommentTextArea =
          "id" in event.target && event.target.id === textAreaId;

        const isCmdEnter =
          event.key === "Enter" && (event.metaKey || event.ctrlKey);

        if (isCommentTextArea && isCmdEnter) {
          event.preventDefault();
          event.currentTarget.requestSubmit();
        }
      }}
    >
      <div className="flex-1">
        <Textarea
          id={textAreaId}
          autoFocus={autoFocus}
          name="comment"
          ref={textAreaRef}
          placeholder="Write a comment..."
          className="resize-none rounded-2xl border border-gray-200 p-3 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-800 dark:bg-gray-950 dark:focus:border-primary"
          disabled={isPending}
        />
      </div>
      <Button className="flex flex-row gap-2" disabled={isPending}>
        {isPending ? <Spinner /> : <ChatBubbleIcon className="w-4 h-4" />} Post
      </Button>
      {extraButton}
    </form>
  );
}

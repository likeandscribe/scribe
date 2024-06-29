"use client";

import useSWR, { preload } from "swr";
import { DID } from "../data/atproto/did";
import { HoverCardTrigger, HoverCardContent } from "./ui/hover-card";
import { ReactNode, Suspense } from "react";
import { Skeleton } from "./ui/skeleton";
import { ChatBubbleIcon, Link1Icon } from "@radix-ui/react-icons";
import { ApiRouteResponse } from "../api-route";
import type { GET as GetHoverCardContent } from "@/app/api/hover-card-content/route";
import Link from "next/link";

type Props = {
  did: DID;
  children: ReactNode;
  asChild?: boolean;
  avatar: ReactNode;
  initialHandle: string;
};

export function UserHoverCardClient({
  did,
  children,
  asChild,
  avatar,
  initialHandle,
}: Props) {
  return (
    <>
      <HoverCardTrigger
        asChild={asChild}
        onMouseEnter={() => {
          preload(did, getHoverCardData);
        }}
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex gap-4">
          <Link href={`/profile/${initialHandle}`} className="shrink-0">
            {avatar}
          </Link>
          <div className="flex flex-col gap-1 basis-full">
            <Suspense fallback={<Fallback handle={initialHandle} />}>
              <Content did={did} />
            </Suspense>
          </div>
        </div>
      </HoverCardContent>
    </>
  );
}

function Content({ did }: { did: DID }) {
  const { data } = useSWR(did, getHoverCardData, {
    suspense: true,
    revalidateOnMount: false,
  });

  return (
    <>
      <Link href={`/profile/${data.handle}`} className="text-sm font-semibold">
        @{data.handle}
      </Link>
      <p
        className="text-sm flex gap-2 items-center"
        title={`${data.commentCount} comments`}
      >
        <ChatBubbleIcon /> {data.commentCount}
      </p>
      <p
        className="text-sm flex gap-2 items-center"
        title={`${data.postCount} posts`}
      >
        <Link1Icon /> {data.postCount}
      </p>
    </>
  );
}

function Fallback({ handle }: { handle: string }) {
  return (
    <>
      <Link href={`/profile/${handle}`} className="text-sm font-semibold">
        @{handle}
      </Link>
      <Skeleton className="h-5 w-12" />
      <Skeleton className="h-5 w-12" />
    </>
  );
}

async function getHoverCardData(
  did: DID,
): Promise<ApiRouteResponse<typeof GetHoverCardContent>> {
  const response = await fetch(`/api/hover-card-content?did=${did}`);
  return response.json();
}

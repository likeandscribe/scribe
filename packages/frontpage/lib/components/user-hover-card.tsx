import { UserAvatar } from "./user-avatar";
import { HoverCard } from "@/lib/components/ui/hover-card";
import { DID } from "../data/atproto/did";
import { getVerifiedHandle } from "../data/user";
import { UserHoverCardClient } from "./user-hover-card-client";

type Props = {
  did: DID;
  children: React.ReactNode;
  asChild?: boolean;
};

export async function UserHoverCard({ did, children, asChild }: Props) {
  // Fetch this early on the server because it's almost certainly already cached this request
  const handle = await getVerifiedHandle(did);
  return (
    <HoverCard>
      <UserHoverCardClient
        avatar={<UserAvatar did={did} size="medium" />}
        did={did}
        asChild={asChild}
        initialHandle={handle ?? ""}
      >
        {children}
      </UserHoverCardClient>
    </HoverCard>
  );
}

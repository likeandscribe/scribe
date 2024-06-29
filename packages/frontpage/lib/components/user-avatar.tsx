import "server-only";
import { getBlueskyProfile } from "@/lib/data/user";
import { Suspense } from "react";
import { DID } from "../data/atproto/did";

const userAvatarSizes = {
  small: 22,
  medium: 100,
  large: 150,
};

type Size = keyof typeof userAvatarSizes;

type UserAvatarProps = {
  did: DID;
  size?: Size;
};

export async function UserAvatar(props: UserAvatarProps) {
  return (
    <Suspense fallback={<AvatarFallback size={props.size} />}>
      <AvatarImage {...props} />
    </Suspense>
  );
}

function AvatarFallback({ size }: { size: UserAvatarProps["size"] }) {
  const sizePx = userAvatarSizes[size ?? "small"];
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="#fff" />
    </svg>
  );
}

async function AvatarImage({
  did,
  size: sizeVariant = "small",
}: UserAvatarProps) {
  const { avatar } = await getBlueskyProfile(did);
  const size = userAvatarSizes[sizeVariant];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="rounded-full"
    />
  );
}

import { unstable_noStore } from "next/cache";
import Home from "../page";
import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function AuthedHomepage() {
  unstable_noStore();

  return <Home />;
}

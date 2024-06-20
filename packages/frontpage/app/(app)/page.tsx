import { Home } from "./_components/home-page";

export const revalidate = 900; // 15 minutes
export const dynamic = "force-static";

export default function HomePage() {
  return <Home />;
}

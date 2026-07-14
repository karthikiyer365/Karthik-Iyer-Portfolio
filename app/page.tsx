import { loadContent } from "@/lib/content.server";
import HomePage from "@/components/HomePage";

export default function Page() {
  const { fileTree, fileContents, githubUrls } = loadContent();
  return (
    <HomePage
      fileTree={fileTree}
      fileContents={fileContents}
      githubUrls={githubUrls}
    />
  );
}

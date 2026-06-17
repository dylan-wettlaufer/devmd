import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthErrorPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Could not sign in</CardTitle>
          <CardDescription>
            GitHub OAuth could not complete for this DevMD session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            {message ?? "Try signing in again."}
          </p>
          <Button asChild>
            <Link href="/auth/sign-in">Sign in with GitHub</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  getInterests,
  getProfession,
  getContentTypes,
  clearPreferences,
} from "@/lib/local-prefs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  const router = useRouter();
  const [interests, setInterests] = useState<string[]>([]);
  const [profession, setProfession] = useState("");
  const [contentTypes, setContentTypes] = useState<string[]>([]);

  useEffect(() => {
    setInterests(getInterests());
    setProfession(getProfession());
    setContentTypes(getContentTypes());
  }, []);

  const handleClear = () => {
    clearPreferences();
    router.push("/feed");
  };

  return (
    <AppShell>
      <PageContainer size="narrow">
        <PageHeader
          eyebrow="Profile"
          title="Your preferences"
          description="Manage what shapes your daily AI feed."
        />

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Profession</CardTitle>
              <CardDescription>Primary field for source matching</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{profession || "Not set"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Interests ({interests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interests.map((t) => (
                    <Badge key={t} variant="secondary" className="font-semibold">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No interests selected</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Content formats</CardTitle>
            </CardHeader>
            <CardContent>
              {contentTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((c) => (
                    <Badge key={c} variant="outline" className="font-semibold">
                      {c}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">All formats</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1 rounded-full font-semibold" asChild>
              <Link href="/feed">Edit interests</Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              className="rounded-full font-semibold"
            >
              Reset
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}

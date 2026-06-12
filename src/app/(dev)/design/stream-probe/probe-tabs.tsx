"use client";

import { use } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

/** The client tabs shell mirroring DashboardTabs' structure (children-as-props
 *  through client TabsContent) - the composition under test. */
export function ProbeTabs({
  a,
  b,
  c,
}: {
  a: React.ReactNode;
  b: React.ReactNode;
  c: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="a">
      <TabsList variant="line">
        <TabsTrigger value="a">A server-child</TabsTrigger>
        <TabsTrigger value="b">B + cookies</TabsTrigger>
        <TabsTrigger value="c">C use()</TabsTrigger>
      </TabsList>
      <TabsContent value="a" className="pt-4">
        {a}
      </TabsContent>
      <TabsContent value="b" className="pt-4">
        {b}
      </TabsContent>
      <TabsContent value="c" className="pt-4">
        {c}
      </TabsContent>
    </Tabs>
  );
}

/** The guest-proven shape: a body-created promise unwrapped client-side. */
export function UseClientSection({ promise }: { promise: Promise<string> }) {
  const value = use(promise);
  return <p data-probe="c">{value}</p>;
}

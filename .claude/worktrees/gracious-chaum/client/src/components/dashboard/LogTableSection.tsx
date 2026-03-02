import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogEntriesTable } from "@/components/entries/LogEntriesTable";

export const LogTableSection = () => {
  return (
    <section className="mb-8">
      <Card>
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b">
            <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0">
              <TabsTrigger 
                value="overview"
                className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Progress Overview
              </TabsTrigger>
              <TabsTrigger 
                value="detailed"
                className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Detailed Log Table
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Progress Overview
                </h3>
                <p className="text-muted-foreground">
                  Your progress summary is displayed in the cards above. 
                  Switch to the "Detailed Log Table" tab to view individual entries.
                </p>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="detailed" className="mt-0">
            <CardContent className="p-6">
              <LogEntriesTable />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </section>
  );
};

import React from "react";
import AdminPageHeader from "@/components/admin/common/AdminPageHeader";
import AdminCard from "@/components/admin/common/AdminCard";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

export default function AdminLayoutDemo() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <AdminPageHeader
              title="Admin Layout Demo"
              description="This demonstrates the new admin layout components"
              actions={
                <>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New
                  </Button>
                </>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminCard
                title="Standard Card"
                description="This is a standard admin card with content"
              >
                <p>This is the content of the card.</p>
              </AdminCard>

              <AdminCard
                title="Loading State"
                description="This card demonstrates the loading state"
                isLoading={true}
              >
                <p>This content won't be visible while loading.</p>
              </AdminCard>

              <AdminCard
                title="Error State"
                description="This card demonstrates the error state"
                error="An error occurred while loading data"
                onRetry={() => alert("Retry clicked")}
              >
                <p>This content won't be visible when there's an error.</p>
              </AdminCard>

              <AdminCard
                title="Card with Footer"
                description="This card includes a footer section"
                footer={
                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2">
                      Cancel
                    </Button>
                    <Button>Save</Button>
                  </div>
                }
              >
                <p>This card has a footer with action buttons.</p>
              </AdminCard>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

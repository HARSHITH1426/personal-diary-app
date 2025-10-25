"use client";

import React, { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useDiaryStore } from "@/hooks/use-diary-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DiaryEntry } from "@/lib/types";
import { useUser } from "@/firebase";

export default function SettingsPage() {
  const { entries, actions } = useDiaryStore(state => ({ entries: state.entries, actions: state.actions }));
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { user } = useUser();

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(entries, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `core-diary-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast({
      title: "Export Successful",
      description: "Your diary has been exported as a JSON file.",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to import entries." });
        return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File could not be read.");
        }
        const importedEntries = JSON.parse(text) as DiaryEntry[];
        if (!Array.isArray(importedEntries)) {
            throw new Error("Invalid file format. Expected an array of entries.");
        }
        actions.importEntries(importedEntries, user.uid);
        toast({
          title: "Import Successful",
          description: "Your entries have been imported.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
      } finally {
        setIsImporting(false);
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Settings</CardTitle>
          <CardDescription>Manage your diary data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold">Export Diary</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Download all your entries as a JSON file for backup.
            </p>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export All Entries
            </Button>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold">Import Diary</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Import entries from a previously exported JSON file. This will merge entries and avoid duplicates.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
              disabled={isImporting}
            />
            <Button onClick={handleImportClick} disabled={isImporting}>
              <Upload className="mr-2 h-4 w-4" /> {isImporting ? 'Importing...' : 'Import from File'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

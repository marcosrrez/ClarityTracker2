import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, FileText, Calendar, ArrowRight, Plus } from "lucide-react";

type EntryMode = "quick" | "detailed";

export default function LogSession() {
  const [mode, setMode] = useState<EntryMode>("quick");

  const toggleMode = () => {
    setMode(mode === "quick" ? "detailed" : "quick");
  };

  const isQuickMode = mode === "quick";

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Log Session</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Record your therapy session and track progress toward licensure
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={isQuickMode ? "default" : "secondary"} className="flex items-center gap-2">
            {isQuickMode ? <Zap className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {isQuickMode ? "Quick Entry" : "Detailed Entry"}
          </Badge>
          <Button
            variant="outline"
            onClick={toggleMode}
            className="flex items-center gap-2"
          >
            {isQuickMode ? "Switch to Detailed" : "Switch to Quick"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Session Details
          </CardTitle>
          <CardDescription>
            {isQuickMode 
              ? "Enter essential session information quickly"
              : "Comprehensive session documentation with detailed notes"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <Plus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isQuickMode ? "Quick Session Entry" : "Detailed Session Documentation"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                {isQuickMode 
                  ? "This mode focuses on essential information for fast daily logging. Perfect for busy counselors who need to quickly record their sessions."
                  : "This mode provides comprehensive fields for detailed documentation, ideal for supervision preparation and thorough record keeping."
                }
              </p>
              
              <div className="flex justify-center gap-4">
                <Link href="/add-entry">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Use Existing Add Entry Form
                  </Button>
                </Link>
                <Link href="/quick-entry">
                  <Button variant="outline">
                    Use Existing Quick Entry Form
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Strategic Consolidation in Progress
              </h4>
              <p className="text-blue-700 dark:text-blue-200 text-sm">
                This unified interface demonstrates our "less is more" approach by combining separate entry forms into one intelligent system. 
                The form adapts based on your needs - quick for efficiency, detailed for comprehensive documentation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
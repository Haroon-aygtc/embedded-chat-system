import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Info,
} from "lucide-react";

const VideoTutorials = () => {
  const [activeTab, setActiveTab] = useState("intro");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const tutorials = [
    {
      id: "intro",
      title: "Introduction to Chat Widget",
      description: "Learn the basics of the embeddable chat widget",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "3:45",
      category: "Beginner",
    },
    {
      id: "setup",
      title: "Setting Up Your First Widget",
      description:
        "Step-by-step guide to configure and deploy your chat widget",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "5:20",
      category: "Beginner",
    },
    {
      id: "context-rules",
      title: "Creating Context Rules",
      description:
        "Learn how to create and manage context rules for your AI responses",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "4:15",
      category: "Intermediate",
    },
    {
      id: "3d-demo",
      title: "3D Widget Customization",
      description: "Advanced 3D visualization of widget customization options",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "6:30",
      category: "Advanced",
    },
  ];

  const activeTutorial =
    tutorials.find((tutorial) => tutorial.id === activeTab) || tutorials[0];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Video Tutorials
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Learn how to use the chat widget platform through interactive video
          tutorials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tutorial Library</CardTitle>
              <CardDescription>Browse available tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tutorials.map((tutorial) => (
                  <div
                    key={tutorial.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${activeTab === tutorial.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    onClick={() => setActiveTab(tutorial.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-sm">
                          {tutorial.title}
                        </h3>
                        <p className="text-xs mt-1 opacity-80">
                          {tutorial.duration}
                        </p>
                      </div>
                      <Badge
                        variant={
                          activeTab === tutorial.id ? "outline" : "secondary"
                        }
                        className="ml-2"
                      >
                        {tutorial.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{activeTutorial.title}</CardTitle>
                  <CardDescription>
                    {activeTutorial.description}
                  </CardDescription>
                </div>
                <Badge>{activeTutorial.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                <iframe
                  src={`${activeTutorial.videoUrl}?autoplay=0&mute=${isMuted ? 1 : 0}`}
                  className="absolute inset-0 w-full h-full"
                  title={activeTutorial.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>

                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="description">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="space-y-4 pt-4">
                  <p>
                    This tutorial covers {activeTutorial.title.toLowerCase()} in
                    detail. You'll learn how to effectively use the chat widget
                    platform and implement best practices for your specific use
                    case.
                  </p>

                  <h3 className="text-lg font-medium mt-2">
                    What You'll Learn
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Understanding the core concepts</li>
                    <li>Step-by-step implementation guide</li>
                    <li>Best practices and optimization tips</li>
                    <li>Troubleshooting common issues</li>
                  </ul>

                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Pro Tip</AlertTitle>
                    <AlertDescription>
                      For the best learning experience, follow along with the
                      tutorial by implementing each step in your own
                      environment.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="transcript" className="pt-4">
                  <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                    <p className="text-sm">
                      <span className="text-muted-foreground">0:00</span> -
                      Welcome to this tutorial on{" "}
                      {activeTutorial.title.toLowerCase()}.
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">0:15</span> - In
                      this video, we'll cover everything you need to know about
                      setting up and configuring your chat widget.
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">0:30</span> -
                      Let's start by looking at the admin dashboard and the
                      available options.
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">1:00</span> - The
                      first step is to create a new widget configuration by
                      clicking on the "New Widget" button.
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">1:30</span> - Now,
                      let's customize the appearance of our widget by selecting
                      colors, position, and size.
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">2:15</span> -
                      Next, we'll configure the context rules to ensure our AI
                      provides relevant responses.
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">3:00</span> -
                      Let's test our widget to make sure it's working as
                      expected.
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">3:30</span> -
                      Finally, we'll generate the embed code and add it to our
                      website.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Downloadable Resources
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-muted/50">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Tutorial Slides</h4>
                            <p className="text-sm text-muted-foreground">
                              PDF, 2.4MB
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Download
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/50">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Code Samples</h4>
                            <p className="text-sm text-muted-foreground">
                              ZIP, 1.8MB
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Download
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/50">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Cheat Sheet</h4>
                            <p className="text-sm text-muted-foreground">
                              PDF, 0.5MB
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Download
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/50">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              Configuration Templates
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              JSON, 0.2MB
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Download
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator className="my-4" />

                    <h3 className="text-lg font-medium">Related Tutorials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="justify-start h-auto py-2 px-4"
                      >
                        <div className="text-left">
                          <h4 className="font-medium">
                            Advanced Context Rules
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            6:45 • Advanced
                          </p>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto py-2 px-4"
                      >
                        <div className="text-left">
                          <h4 className="font-medium">
                            Embedding in React Apps
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            8:20 • Intermediate
                          </p>
                        </div>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoTutorials;

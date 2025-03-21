import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Code,
} from "lucide-react";

const AnimationDemo = () => {
  const [activeTab, setActiveTab] = useState("2d");
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const animationContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Animation duration in milliseconds
  const animationDuration = 5000;

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Reset animation
  const resetAnimation = () => {
    setIsPlaying(false);
    setAnimationProgress(0);
    startTimeRef.current = null;
  };

  // Handle zoom in
  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  // Handle zoom out
  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!animationContainerRef.current) return;

    if (!isFullscreen) {
      if (animationContainerRef.current.requestFullscreen) {
        animationContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const updateAnimation = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateAnimation);
      } else {
        setIsPlaying(false);
        startTimeRef.current = null;
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Manual progress control
  const handleProgressChange = (value: number[]) => {
    setAnimationProgress(value[0] / 100);
    if (isPlaying) {
      setIsPlaying(false);
    }
    startTimeRef.current = null;
  };

  // 2D Animation Component
  const TwoDAnimation = () => {
    // Calculate positions based on animation progress
    const chatIconX = 20 + animationProgress * 60;
    const chatIconY = 20;
    const chatWidgetX = 100;
    const chatWidgetY = 20;
    const chatWidgetScale =
      animationProgress > 0.3 ? Math.min((animationProgress - 0.3) * 2, 1) : 0;
    const messageX = 120;
    const messageY =
      60 + (animationProgress > 0.6 ? (animationProgress - 0.6) * 100 : 0);
    const messageOpacity =
      animationProgress > 0.6 ? Math.min((animationProgress - 0.6) * 5, 1) : 0;
    const responseX = 180;
    const responseY = 100;
    const responseScale =
      animationProgress > 0.8 ? Math.min((animationProgress - 0.8) * 5, 1) : 0;

    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 200"
        className="bg-white rounded-lg"
      >
        {/* Background elements */}
        <rect
          x="0"
          y="0"
          width="300"
          height="200"
          fill="#f8fafc"
          rx="8"
          ry="8"
        />
        <rect
          x="10"
          y="160"
          width="280"
          height="30"
          fill="#e2e8f0"
          rx="4"
          ry="4"
        />
        <rect
          x="20"
          y="170"
          width="200"
          height="10"
          fill="#cbd5e1"
          rx="2"
          ry="2"
        />
        <rect
          x="240"
          y="170"
          width="40"
          height="10"
          fill="#94a3b8"
          rx="2"
          ry="2"
        />

        {/* Chat icon */}
        <circle cx={chatIconX} cy={chatIconY} r="15" fill="#3b82f6" />
        <rect
          x={chatIconX - 5}
          y={chatIconY - 3}
          width="10"
          height="6"
          fill="white"
          rx="1"
          ry="1"
        />

        {/* Chat widget */}
        <g
          style={{
            transform: `scale(${chatWidgetScale})`,
            transformOrigin: `${chatWidgetX}px ${chatWidgetY}px`,
          }}
        >
          <rect
            x={chatWidgetX - 40}
            y={chatWidgetY - 20}
            width="80"
            height="120"
            fill="white"
            stroke="#3b82f6"
            strokeWidth="2"
            rx="4"
            ry="4"
          />
          <rect
            x={chatWidgetX - 40}
            y={chatWidgetY - 20}
            width="80"
            height="20"
            fill="#3b82f6"
            rx="4"
            ry="4"
          />
          <text
            x={chatWidgetX}
            y={chatWidgetY - 5}
            fontSize="10"
            fill="white"
            textAnchor="middle"
          >
            Chat
          </text>
          <line
            x1={chatWidgetX - 30}
            y1={chatWidgetY + 20}
            x2={chatWidgetX + 30}
            y2={chatWidgetY + 20}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        </g>

        {/* User message */}
        <g style={{ opacity: messageOpacity }}>
          <rect
            x={messageX - 30}
            y={messageY - 10}
            width="60"
            height="20"
            fill="#3b82f6"
            rx="10"
            ry="10"
          />
          <text
            x={messageX}
            y={messageY + 4}
            fontSize="8"
            fill="white"
            textAnchor="middle"
          >
            Hello!
          </text>
        </g>

        {/* AI response */}
        <g
          style={{
            transform: `scale(${responseScale})`,
            transformOrigin: `${responseX}px ${responseY}px`,
          }}
        >
          <rect
            x={responseX - 40}
            y={responseY - 10}
            width="80"
            height="20"
            fill="#f1f5f9"
            stroke="#e2e8f0"
            strokeWidth="1"
            rx="10"
            ry="10"
          />
          <text
            x={responseX}
            y={responseY + 4}
            fontSize="8"
            fill="#334155"
            textAnchor="middle"
          >
            How can I help?
          </text>
        </g>
      </svg>
    );
  };

  // 3D Animation Component (simplified representation)
  const ThreeDAnimation = () => {
    // Calculate 3D transforms based on animation progress
    const rotateY = animationProgress * 360;
    const translateZ = -100 + animationProgress * 200;

    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden">
        <div
          className="relative"
          style={{
            perspective: "800px",
            perspectiveOrigin: "center",
          }}
        >
          <div
            className="w-64 h-64 relative"
            style={{
              transform: `rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
              transformStyle: "preserve-3d",
              transition: isPlaying ? "none" : "transform 0.5s ease",
            }}
          >
            {/* Front face - Chat widget */}
            <div
              className="absolute inset-0 bg-white rounded-lg border-2 border-blue-500 flex flex-col overflow-hidden"
              style={{
                transform: "translateZ(32px)",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="bg-blue-500 text-white p-2 text-center font-medium">
                Chat Widget
              </div>
              <div className="flex-1 p-4 flex flex-col justify-end">
                <div className="bg-blue-500 text-white self-end rounded-full py-1 px-3 mb-2 text-sm">
                  Hello!
                </div>
                <div className="bg-gray-100 self-start rounded-full py-1 px-3 text-sm">
                  How can I help?
                </div>
              </div>
            </div>

            {/* Back face - Code */}
            <div
              className="absolute inset-0 bg-gray-900 text-green-400 p-4 font-mono text-xs rounded-lg"
              style={{
                transform: "rotateY(180deg) translateZ(32px)",
                backfaceVisibility: "hidden",
              }}
            >
              <pre>
                {`<ChatWidget
  position="bottom-right"
  primaryColor="#3b82f6"
  initiallyOpen={false}
  allowAttachments={true}
  contextMode="general"
/>`}
              </pre>
            </div>

            {/* Right face */}
            <div
              className="absolute inset-0 bg-blue-100 flex items-center justify-center rounded-lg"
              style={{
                width: "64px",
                height: "100%",
                transform: "rotateY(90deg) translateZ(96px)",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="transform rotate-90 text-blue-800 font-bold">
                Settings
              </div>
            </div>

            {/* Left face */}
            <div
              className="absolute inset-0 bg-blue-100 flex items-center justify-center rounded-lg"
              style={{
                width: "64px",
                height: "100%",
                transform: "rotateY(-90deg) translateZ(96px)",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="transform -rotate-90 text-blue-800 font-bold">
                Analytics
              </div>
            </div>

            {/* Top face */}
            <div
              className="absolute inset-0 bg-blue-200 flex items-center justify-center rounded-lg"
              style={{
                height: "64px",
                width: "100%",
                transform: "rotateX(90deg) translateZ(96px)",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="text-blue-800 font-bold">Context Rules</div>
            </div>

            {/* Bottom face */}
            <div
              className="absolute inset-0 bg-blue-200 flex items-center justify-center rounded-lg"
              style={{
                height: "64px",
                width: "100%",
                transform: "rotateX(-90deg) translateZ(96px)",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="text-blue-800 font-bold">Templates</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Interactive Animations
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Explore the chat widget platform through interactive 2D and 3D
          animations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-[400px] mx-auto mb-8">
          <TabsTrigger value="2d">2D Animation</TabsTrigger>
          <TabsTrigger value="3d">3D Animation</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {activeTab === "2d"
                        ? "2D Chat Widget Flow"
                        : "3D Widget Visualization"}
                    </CardTitle>
                    <CardDescription>
                      {activeTab === "2d"
                        ? "Visual representation of the chat widget interaction flow"
                        : "Interactive 3D model of the chat widget components"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {activeTab === "2d" ? "2D Animation" : "3D Animation"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  ref={animationContainerRef}
                  className="relative aspect-video bg-slate-50 rounded-md overflow-hidden border"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center",
                  }}
                >
                  {activeTab === "2d" ? <TwoDAnimation /> : <ThreeDAnimation />}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <div className="w-full flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePlay}
                    disabled={animationProgress >= 1 && !isPlaying}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetAnimation}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 px-2">
                    <Slider
                      value={[animationProgress * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleProgressChange}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={zoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={zoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Animation Progress: {Math.round(animationProgress * 100)}%
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Animation Details</CardTitle>
                <CardDescription>
                  {activeTab === "2d"
                    ? "Learn about the 2D animation sequence"
                    : "Understand the 3D model components"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    {activeTab === "2d"
                      ? "Animation Sequence"
                      : "3D Model Features"}
                  </h3>
                  <ul className="space-y-2">
                    {activeTab === "2d" ? (
                      <>
                        <li className="flex items-start space-x-2">
                          <Badge variant="outline" className="mt-0.5">
                            1
                          </Badge>
                          <span className="text-sm">
                            Chat icon appears in the corner of the website
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Badge variant="outline" className="mt-0.5">
                            2
                          </Badge>
                          <span className="text-sm">
                            User clicks the icon to open the chat widget
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Badge variant="outline" className="mt-0.5">
                            3
                          </Badge>
                          <span className="text-sm">
                            User types and sends a message
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Badge variant="outline" className="mt-0.5">
                            4
                          </Badge>
                          <span className="text-sm">
                            AI responds with a helpful message
                          </span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start space-x-2">
                          <Badge variant="outline" className="mt-0.5">
                            Front
                          </Badge>
                          <span className="text-sm">
                            Chat interface with messages
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Badge variant="outline" className="mt-0.5">
                            Back
                          </Badge>
                          <span className="text-sm">Configuration code</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Badge variant="outline" className="mt-0.5">
                            Sides
                          </Badge>
                          <span className="text-sm">
                            Settings and Analytics panels
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Badge variant="outline" className="mt-0.5">
                            Top/Bottom
                          </Badge>
                          <span className="text-sm">
                            Context Rules and Templates
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    Implementation Details
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "2d"
                      ? "This animation is created using SVG and React state to control the animation sequence."
                      : "The 3D model uses CSS 3D transforms to create a cube with different faces representing widget components."}
                  </p>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Code className="mr-2 h-4 w-4" />
                    View Source Code
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Related Resources</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-auto py-2"
                    >
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Video Tutorial</h4>
                        <p className="text-xs text-muted-foreground">
                          Watch the complete guide
                        </p>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-auto py-2"
                    >
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Documentation</h4>
                        <p className="text-xs text-muted-foreground">
                          Read detailed explanations
                        </p>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default AnimationDemo;

import { Card, CardContent, CardTitle, CardHeader, CardFooter } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

const meta = {
  title: "ui/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  argTypes: {},
};
export default meta;

export const Base = {
  render: (args: any) => (
    <Carousel {...args} className="mx-12 w-full max-w-xs">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
  args: {},
};
export const Size = {
  render: (args: any) => (
    <Carousel {...args} className="mx-12 w-full max-w-xs">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="basis-1/3">
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
  args: {},
};
export const Default = {
  render: () => <Carousel>
    <CarouselContent>
      <CarouselItem>
        <Card>
          <CardContent>
            <p>Card Content</p>
          </CardContent>
        </Card>
      </CarouselItem>
    </CarouselContent>
  </Carousel>,
  args: {},
};
export const WithHeader = {
  render: () => <Carousel>
    <CarouselContent>
      <CarouselItem>
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card Content</p>
          </CardContent>
        </Card>
      </CarouselItem>
    </CarouselContent>
  </Carousel>,
  args: {},
};
export const WithFooter = {
  render: () => <Carousel>
    <CarouselContent>
      <CarouselItem>
        <Card>
          <CardContent>
            <p>Card Content</p>
          </CardContent>
          <CardFooter>
            <Button>Read More</Button>
          </CardFooter>
        </Card>
      </CarouselItem>
    </CarouselContent>
  </Carousel>,
  args: {},
};
export const WithImage = {
  render: () => <Carousel>
    <CarouselContent>
      <CarouselItem>
        <Card>
          <CardContent>
            <img src="https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=800&dpr=2&q=80" alt="Card Image" />
          </CardContent>
        </Card>
      </CarouselItem>
    </CarouselContent>
  </Carousel>,
  args: {},
};

export const WithVideo = {
  render: () => <Carousel>
    <CarouselContent>
      <CarouselItem>
        <Card>
          <CardContent>
            <video src="https://www.w3schools.com/html/mov_bbb.mp4" controls />
          </CardContent>
        </Card>
      </CarouselItem>
    </CarouselContent>
  </Carousel>,
  args: {},
};

export const WithMultiple = {
  render: () => <Carousel>
    <CarouselContent>
      {Array.from({ length: 5 }).map((_, index) => (
        <CarouselItem key={index}>
          <Card>
            <CardContent className="flex aspect-square items-center justify-center p-6">
              <span className="text-4xl font-semibold">{index + 1}</span>
            </CardContent>
          </Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>,
  args: {},
};

export const WithMultipleWithHeader = {
  render: () => <Carousel>
    <CarouselContent>
      {Array.from({ length: 5 }).map((_, index) => (
        <CarouselItem key={index}>
          <Card>
            <CardHeader>
              <CardTitle>Card Title {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="flex aspect-square items-center justify-center p-6">
              <span className="text-4xl font-semibold">{index + 1}</span>
            </CardContent>
          </Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>,
  args: {},
};

export const WithMultipleWithFooter = {
  render: () => <Carousel>
    <CarouselContent>
      {Array.from({ length: 5 }).map((_, index) => (
        <CarouselItem key={index}>
          <Card>
            <CardContent className="flex aspect-square items-center justify-center p-6">
              <span className="text-4xl font-semibold">{index + 1}</span>
            </CardContent>
            <CardFooter>
              <Button>Read More</Button>
            </CardFooter>
          </Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>,
  args: {},
};


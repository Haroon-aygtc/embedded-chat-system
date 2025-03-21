// [build] library: 'shadcn'
import { AspectRatio } from "@/components/ui/aspect-ratio";

const meta = {
  title: "ui/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

export const Base = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="bg-slate-50 dark:bg-slate-800">
      <img
        src="https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=800&dpr=2&q=80"
        alt="Photo by Alvaro Pinot"
        className="rounded-md object-cover"
      />
    </AspectRatio>
  ),
  args: {},
};

export const Square = {
  render: () => (
    <AspectRatio ratio={1} className="bg-slate-50 dark:bg-slate-800">
      <img
        src="https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=800&dpr=2&q=80"
        alt="Photo by Alvaro Pinot"
        className="rounded-md object-cover"
      />
    </AspectRatio>
  ),
  args: {},
};

export const Video = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="bg-slate-50 dark:bg-slate-800">
      <video src="https://www.w3schools.com/html/mov_bbb.mp4" controls />
    </AspectRatio>
  ),
  args: {},
};

export const Custom = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="bg-slate-50 dark:bg-slate-800">
      <img
        src="https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=800&dpr=2&q=80"
        alt="Photo by Alvaro Pinot"
        className="rounded-md object-cover"
      />
    </AspectRatio>
  ),
  args: {},
};

export const Responsive = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="bg-slate-50 dark:bg-slate-800">
      <img
        src="https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=800&dpr=2&q=80"
        alt="Photo by Alvaro Pinot"
        className="rounded-md object-cover"
      />
    </AspectRatio>
  ),
  args: {},
};


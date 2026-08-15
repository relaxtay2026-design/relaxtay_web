import {
  ChefHat,
  CircleParking,
  Flame,
  Laptop,
  Mountain,
  PlugZap,
  Sailboat,
  Snowflake,
  Sparkles,
  Waves,
  WashingMachine,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/** Maps Amenity.icon (kebab name stored in DB) → lucide component. */
const icons: Record<string, LucideIcon> = {
  wifi: Wifi,
  "chef-hat": ChefHat,
  "circle-parking": CircleParking,
  snowflake: Snowflake,
  flame: Flame,
  waves: Waves,
  "waves-ladder": Waves,
  "washing-machine": WashingMachine,
  laptop: Laptop,
  "plug-zap": PlugZap,
  sailboat: Sailboat,
  mountain: Mountain,
};

export function AmenityIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon className={className} />;
}

// PROTOTYPE, wipe me: home page design variants, picked by ?variant=.
import { Suspense, type ComponentProps } from "react";
import { Browse } from "../Browse";
import { Switcher } from "./Switcher";

type Props = ComponentProps<typeof Browse>;

const VARIANTS: [string, string, (p: Props) => React.ReactNode][] = [
  ["current", "As shipped", (p) => <Browse {...p} />],
];

export function HomeVariants({ variant, ...p }: Props & { variant: string }) {
  const V = (VARIANTS.find(([k]) => k === variant) ?? VARIANTS[0])[2];
  return (
    <>
      <V {...p} />
      <Suspense>
        <Switcher variants={VARIANTS.map(([k, n]) => [k, n])} />
      </Suspense>
    </>
  );
}

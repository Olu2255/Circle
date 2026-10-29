import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  HeartHandshake,
  Sprout,
  UsersRound,
} from "lucide-react";
import { PublicShell } from "@/components/ui";

export default function Home() {
  return (
    <PublicShell>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" /> YOUR AMBITIONS DESERVE COMPANY
          </span>
          <h1>
            Your next chapter.
            <br />
            <em>A shared journey.</em>
          </h1>
          <p>
            Find a small circle of people who get where you’re going. Share what
            you’re working towards, offer what you know, and make room for one
            another.
          </p>
          <Link className="button" href="/circles">
            Find your circle <ArrowRight size={18} />
          </Link>
          <span className="hero-footnote">
            Real people. Common ground. A little more momentum.
          </span>
        </div>
        <div className="orbit-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="orbit-center">
            <Sprout size={38} strokeWidth={1.4} />
            <span>
              room to
              <br />
              <i>grow.</i>
            </span>
          </div>
          <div className="orbit-node node-one">
            <HeartHandshake size={25} />
          </div>
          <div className="orbit-node node-two">
            <UsersRound size={25} />
          </div>
          <div className="orbit-node node-three">
            <ArrowUpRight size={28} />
          </div>
          <span className="art-caption">GOOD THINGS GROW IN CIRCLES</span>
        </div>
      </section>
      <section className="how-it-works">
        <div>
          <span>01 / INTRODUCE YOURSELF</span>
          <h2>Bring your next step.</h2>
          <p>A goal, a starting point, and something you can offer.</p>
        </div>
        <div>
          <span>02 / MAKE A CONNECTION</span>
          <h2>Keep your circle small.</h2>
          <p>Create a circle or join through a personal invitation.</p>
        </div>
        <div>
          <span>03 / FIND COMMON GROUND</span>
          <h2>Get to know your people.</h2>
          <p>Discover the ambitions and skills of your actual members.</p>
        </div>
      </section>
    </PublicShell>
  );
}

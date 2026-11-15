import { useState } from "react";
import type { Story } from "@/types";
import { Icon } from "./icons";
import { Button, IconButton, Speaker } from "./ui";

/**
 * Delftse-methode reading, staged as a chat: the dialogue first, the English on demand.
 * Context is the thing a single sentence cannot give you.
 */
export function StoryView({
  story,
  onPlay,
  onClose,
}: {
  story: Story;
  onPlay: (text: string) => void;
  onClose: () => void;
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [playing, setPlaying] = useState(false);

  async function playAll() {
    setPlaying(true);
    for (const line of story.lines) {
      onPlay(line.text);
      await new Promise((resolve) => setTimeout(resolve, Math.max(1600, line.text.length * 82)));
    }
    setPlaying(false);
  }

  return (
    <div className="screen">
      <div className="row spread">
        <div>
          <p className="hero-eyebrow">Dialoog</p>
          <h1 className="hero-title">{story.title}</h1>
          <p className="hero-sub">{story.situation}</p>
        </div>
        <IconButton name="close" label="Close story" onClick={onClose} />
      </div>

      <div className="row">
        <Button size="sm" variant="primary" icon="play" onClick={() => void playAll()} disabled={playing}>
          {playing ? "Playing…" : "Play all"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowTranslation(!showTranslation)}>
          {showTranslation ? "Hide English" : "Show English"}
        </Button>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        {story.lines.map((line, index) => {
          const you = line.speaker.toLowerCase() === "jij" || line.speaker.toLowerCase() === "you";
          return (
            <div key={`${line.speaker}-${index}`} className={you ? "bubble you" : "bubble them"}>
              <Speaker onClick={() => onPlay(line.text)} />
              <div className="bubble-body">
                <p className="bubble-speaker">{line.speaker}</p>
                <p className="nl small">{line.text}</p>
                {showTranslation ? <p className="small en">{line.translation}</p> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card tight">
        <p className="tiny dim">
          <Icon name="sparkle" size={13} /> Read it out loud with the audio once, then again with the English hidden.
          When you can follow it without the translation, that dialogue is yours.
        </p>
      </div>
    </div>
  );
}

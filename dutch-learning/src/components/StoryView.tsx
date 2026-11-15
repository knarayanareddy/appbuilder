import { useState } from "react";
import type { Story } from "@/types";
import { Button, Card, Speaker } from "./ui";

/**
 * Delftse-methode reading: a whole dialogue first, translation on demand. The point
 * of a story is context a single sentence cannot give you.
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
      // Roughly the time it takes to speak the line, so the next one waits its turn.
      await new Promise((resolve) => setTimeout(resolve, Math.max(1800, line.text.length * 90)));
    }
    setPlaying(false);
  }

  return (
    <div className="screen">
      <div className="row spread">
        <h1>{story.title}</h1>
        <Button small variant="ghost" onClick={onClose} ariaLabel="Close story">
          Close
        </Button>
      </div>
      <p className="small muted">{story.situation}</p>

      <div className="row">
        <Button onClick={() => void playAll()} disabled={playing}>
          {playing ? "Playing…" : "Play the whole dialogue"}
        </Button>
        <Button variant="ghost" onClick={() => setShowTranslation(!showTranslation)}>
          {showTranslation ? "Hide English" : "Show English"}
        </Button>
      </div>

      <div className="stack">
        {story.lines.map((line, index) => (
          <Card key={`${line.speaker}-${index}`} tight>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <Speaker onClick={() => onPlay(line.text)} />
              <div>
                <p className="tiny muted">{line.speaker}</p>
                <p className="nl small">{line.text}</p>
                {showTranslation ? <p className="small en">{line.translation}</p> : null}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="tiny muted">
        Read it out loud with the audio once, then again with the English hidden. When you can follow it without the
        translation, that dialogue is yours.
      </p>
    </div>
  );
}

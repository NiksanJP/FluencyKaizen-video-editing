import { Composition, registerRoot } from 'remotion';
import { TimelineComposition } from '../components/RemotionPlayer';

const RemotionRoot = () => {
  return (
    <Composition
      id="EditorComposition"
      component={TimelineComposition}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        tracks: [],
        fallbackTitle: 'FluencyKaizen',
        playerTotalFrames: 900,
        isPlaying: false,
      }}
    />
  );
};

registerRoot(RemotionRoot);

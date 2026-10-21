import React from 'react';
import { AbsoluteFill, Composition } from 'remotion';
import { Character } from '../kit/characters/Character';
import { POSES } from '../kit/characters/poses';
import { pose } from '../kit/characters/skeleton';
import { PAL } from '../kit/style';
import { CAST } from '../kit/characters/cast';
import { Hand } from '../kit/characters/hands';
import { MEETING, MeetingBack, MeetingTableFront } from '../kit/places/MeetingRoom';
import { Street } from '../kit/places/Street';
import { UnderTable } from '../kit/places/UnderTable';
import { HOME, HomeLiving } from '../kit/places/HomeLiving';
import { BEDROOM, Bedroom } from '../kit/places/Bedroom';
import { DINING, DiningBack, DiningTableFront } from '../kit/places/Dining';
import { DESK, DeskBack, DeskFront } from '../kit/places/OfficeDesk';
import { COFFEE, CoffeeCorner } from '../kit/places/CoffeeCorner';
import { Corridor } from '../kit/places/Corridor';

// One still per place, with a character or two on top for scale.
const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: PAL.paper }}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute' }}>{children}</svg>
  </AbsoluteFill>
);
const stand = POSES.stand;
// seated with forearms on a table top `up` px above the feet (character units)
const atTable = (up: number) => pose({ sit: 1, footR: [52, 0], footL: [64, 0], R: { hand: [60, -up] }, L: { hand: [74, -up + 4] } });

const Meeting: React.FC = () => {
  const up = (MEETING.feetY - MEETING.tableTop) / MEETING.scale;
  const who = ['salim', 'att1', 'hadi', 'jaser', 'att2', 'mona'] as const;
  return (
    <Frame>
      <MeetingBack t={12} />
      {MEETING.seats.map((s, i) => i === 2 ? null : <Character key={i} who={who[i]} p={atTable(up)} x={s.x} y={MEETING.feetY} s={MEETING.scale} facing={s.facing} face={i === 3 ? 'smug' : 'calm'} />)}
      <Character who="att3" p={POSES.explain.p} hands={POSES.explain.hands} x={MEETING.standAt.x} y={MEETING.standAt.y} s={1.45} facing={-1} />
      <MeetingTableFront />
    </Frame>
  );
};

const Under: React.FC = () => (
  <Frame>
    <UnderTable />
    <g transform="translate(860 600) rotate(-20) scale(16)"><Hand g="pen" skin={CAST.salim.skin} /></g>
  </Frame>
);

const StreetShot: React.FC<{ pan: number; eve: boolean }> = ({ pan, eve }) => (
  <Frame>
    <Street pan={pan} eve={eve} />
    <Character who="salim" p={POSES.walk.p} x={900} y={860} s={1.45} />
    <Character who="reem" p={stand.p} x={1150} y={860} s={1.45} facing={-1} />
  </Frame>
);

const sit = POSES.sit;
const Home: React.FC<{ door: number; night: boolean }> = ({ door, night }) => (
  <Frame>
    <HomeLiving door={door} night={night} />
    <Character who="mother" p={sit.p} hands={sit.hands} x={HOME.sofaSeat.x} y={860} s={1.45} />
    <Character who="salim" p={POSES.walk.p} x={HOME.frontDoorX - 40} y={860} s={1.45} facing={-1} />
  </Frame>
);

const Bed: React.FC<{ lamp: number; night: boolean }> = ({ lamp, night }) => (
  <Frame>
    <Bedroom lamp={lamp} night={night} />
    <Character who="salim" p={POSES.write.p} hands={POSES.write.hands} x={BEDROOM.bedSeat.x} y={860} s={1.45} facing={-1} />
  </Frame>
);

const Dining: React.FC<{ food: boolean }> = ({ food }) => {
  const up = (DINING.feetY - DINING.tableTop) / DINING.scale;
  const who = ['salim', 'reem', 'mother', 'att1'] as const;
  return (
    <Frame>
      <DiningBack />
      {DINING.seats.map((s, i) => <Character key={i} who={who[i]} p={atTable(up)} x={s.x} y={DINING.feetY} s={DINING.scale} facing={s.facing} face="calm" />)}
      <DiningTableFront food={food} />
    </Frame>
  );
};

const Desk: React.FC = () => (
  <Frame>
    <DeskBack />
    <Character who="salim" p={POSES.sitType.p} hands={POSES.sitType.hands} x={DESK.seat.x} y={860} s={1.45} />
    <DeskFront />
  </Frame>
);

const Coffee: React.FC = () => (
  <Frame>
    <CoffeeCorner />
    <Character who="salim" p={stand.p} x={COFFEE.left.x} y={COFFEE.y} s={1.45} />
    <Character who="hadi" p={POSES.explain.p} hands={POSES.explain.hands} x={COFFEE.right.x} y={COFFEE.y} s={1.45} facing={-1} />
  </Frame>
);

const Hall: React.FC<{ pan: number }> = ({ pan }) => (
  <Frame>
    <Corridor pan={pan} />
    <Character who="salim" p={POSES.walk.p} x={900} y={860} s={1.45} />
  </Frame>
);

const cfg = { durationInFrames: 1, fps: 60, width: 1920, height: 1080 } as const;
export const PlacesPreview: React.FC = () => (
  <>
    <Composition id="Meeting" component={Meeting} {...cfg} />
    <Composition id="UnderTable" component={Under} {...cfg} />
    <Composition id="Street" component={StreetShot} {...cfg} defaultProps={{ pan: 0, eve: false }} />
    <Composition id="StreetEve" component={StreetShot} {...cfg} defaultProps={{ pan: 1, eve: true }} />
    <Composition id="Home" component={Home} {...cfg} defaultProps={{ door: 0, night: false }} />
    <Composition id="HomeNight" component={Home} {...cfg} defaultProps={{ door: 0.7, night: true }} />
    <Composition id="Bedroom" component={Bed} {...cfg} defaultProps={{ lamp: 1, night: true }} />
    <Composition id="BedroomDark" component={Bed} {...cfg} defaultProps={{ lamp: 0, night: true }} />
    <Composition id="Dining" component={Dining} {...cfg} defaultProps={{ food: true }} />
    <Composition id="Desk" component={Desk} {...cfg} />
    <Composition id="Coffee" component={Coffee} {...cfg} />
    <Composition id="Corridor" component={Hall} {...cfg} defaultProps={{ pan: 0.3 }} />
  </>
);

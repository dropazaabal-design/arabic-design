// Places, props and metaphors exported as SVG at their default (or a representative) state:
// [file name, element, folder, viewBox]. Places and metaphors are full 1920×1080 frames; props get a tight box.
// Arabic inside them is HTML in <foreignObject> set in Tajawal/Cairo: open the SVGs in a browser with those fonts.
import React from 'react';
import { Bedroom } from '../src/kit/places/Bedroom';
import { CoffeeCorner } from '../src/kit/places/CoffeeCorner';
import { Corridor } from '../src/kit/places/Corridor';
import { DiningBack, DiningTableFront } from '../src/kit/places/Dining';
import { HomeLiving } from '../src/kit/places/HomeLiving';
import { MeetingBack, MeetingTableFront } from '../src/kit/places/MeetingRoom';
import { DeskBack, DeskFront } from '../src/kit/places/OfficeDesk';
import { Street } from '../src/kit/places/Street';
import { UnderTable } from '../src/kit/places/UnderTable';
import { Doors, Gap, Lake, Loop, Plan, Pot, SingleDoor, Storm, Tree, Wave } from '../src/kit/metaphors';
import {
  Calendar, Chair, ChatScreen, Clock, Folder, Glass, ICONS, Lamp, Laptop, LockScreen, Mug, Notebook, NotificationBanner, Paper, Pen, Phone,
  Plant, Plate, PostScreen, SpeechBubble, ThoughtCloud,
} from '../src/kit/props';

const FRAME = '0 0 1920 1080';
type Item = [string, React.ReactElement, string, string];
const prop = (name: string, el: React.ReactElement, vb: string): Item => [name, el, 'assets/props', vb];

export const items = (): Item[] => [
  ['meeting-room', <g><MeetingBack /><MeetingTableFront /></g>, 'backgrounds', FRAME],
  ['meeting-room-back', <MeetingBack />, 'backgrounds/layers', FRAME],
  ['meeting-room-table', <MeetingTableFront />, 'backgrounds/layers', FRAME],
  ['under-table', <UnderTable />, 'backgrounds', FRAME],
  ['street', <Street pan={0} />, 'backgrounds', FRAME],
  ['street-dusk', <Street pan={0.6} eve />, 'backgrounds', FRAME],
  ['living-room', <HomeLiving />, 'backgrounds', FRAME],
  ['living-room-night', <HomeLiving night />, 'backgrounds', FRAME],
  ['bedroom', <Bedroom />, 'backgrounds', FRAME],
  ['bedroom-night', <Bedroom night lamp={0.6} />, 'backgrounds', FRAME],
  ['dining-room', <g><DiningBack /><DiningTableFront food /></g>, 'backgrounds', FRAME],
  ['dining-room-back', <DiningBack />, 'backgrounds/layers', FRAME],
  ['dining-room-table', <DiningTableFront food />, 'backgrounds/layers', FRAME],
  ['office-desk', <g><DeskBack /><DeskFront /></g>, 'backgrounds', FRAME],
  ['office-desk-back', <DeskBack />, 'backgrounds/layers', FRAME],
  ['office-desk-front', <DeskFront />, 'backgrounds/layers', FRAME],
  ['coffee-corner', <CoffeeCorner />, 'backgrounds', FRAME],
  ['corridor', <Corridor />, 'backgrounds', FRAME],
  ['lake', <Lake t={0} current={0.3} cut={0} />, 'assets/metaphors', FRAME],
  ['lake-section', <Lake t={2} current={1} cut={1} boat={0.6} />, 'assets/metaphors', FRAME],
  ['pot-pressed', <Pot t={1} boil={0.8} flame={1} press={1} steamOut={0} />, 'assets/metaphors', FRAME],
  ['pot-flame-low', <Pot t={1} boil={0.2} flame={0.3} press={0} steamOut={1} knob={1} />, 'assets/metaphors', FRAME],
  ['three-doors', <Doors t={1} open={[1, 1, 1]} />, 'assets/metaphors', FRAME],
  ['single-door', <SingleDoor t={1} open={0} knock={0.3} />, 'assets/metaphors', FRAME],
  ['tree-wind', <Tree t={1} wind={0.8} roots={0} />, 'assets/metaphors', FRAME],
  ['tree-roots', <Tree t={1} wind={0.3} roots={1} />, 'assets/metaphors', FRAME],
  ['wave', <Wave t={1} phase={0.5} size={1} />, 'assets/metaphors', FRAME],
  ['loop', <Loop t={1} active={1.4} entries={1} />, 'assets/metaphors', FRAME],
  ['storm', <Storm t={1} intensity={0.8} />, 'assets/metaphors', FRAME],
  ['plan', <Plan t={1} written={1} />, 'assets/metaphors', FRAME],
  ['gap', <Gap t={1} open={1} />, 'assets/metaphors', FRAME],
  prop('phone-off', <Phone w={120} />, '-70 -135 140 270'),
  prop('phone-chat', <Phone w={120} screen={<ChatScreen name="جاسر" messages={[{ from: 'them', text: 'أتمنى أن تكون فكرتك القادمة أفضل', time: '23:40' }]} header="night" />} />, '-70 -135 140 270'),
  prop('phone-post', <Phone w={120} screen={<PostScreen author="سليم" text="فكرة صغيرة عن العمل" comments={[{ name: 'حساب', text: 'كلام فارغ', hostile: true }]} menu={1} />} />, '-70 -135 140 270'),
  prop('phone-lock', <Phone w={120} screen={<g><LockScreen time="23:40" /><g transform="translate(12 290)"><NotificationBanner name="جاسر" text="رسالة جديدة" /></g></g>} />, '-70 -135 140 270'),
  prop('notebook', <Notebook open={1} lines={['أشعر بضيق', 'أحتاج وقتًا']} written={1} w={300} />, '-170 -120 340 240'),
  prop('pen', <Pen />, '-40 -10 60 20'),
  prop('paper', <Paper />, '-40 -55 80 110'),
  prop('paper-crumpled', <Paper crumple={1} />, '-40 -40 80 80'),
  prop('folder', <Folder />, '-60 -45 120 90'),
  prop('calendar', <Calendar day={14} />, '-40 -64 80 72'),
  prop('laptop', <Laptop />, '-100 -130 200 150'),
  prop('desk-lamp', <Lamp on={1} />, '-80 -130 200 140'),
  prop('mug', <Mug steam={1} t={1} />, '-30 -90 70 96'),
  prop('glass', <Glass />, '-20 -54 40 58'),
  prop('plate', <Plate />, '-50 -16 100 32'),
  prop('wall-clock', <Clock hours={9} minutes={10} r={40} />, '-46 -46 92 92'),
  prop('plant', <Plant />, '-90 -170 180 176'),
  prop('chair-office', <Chair kind="office" />, '-90 -230 180 240'),
  prop('chair-dining', <Chair />, '-90 -230 180 240'),
  prop('bubble-say', <SpeechBubble w={300} h={130} tail={[-60, 120]}>لن تنجح</SpeechBubble>, '-170 -80 340 220'),
  prop('bubble-think', <ThoughtCloud w={300} h={180} tail={[-90, 150]}>لا يهم</ThoughtCloud>, '-170 -110 340 290'),
  ...Object.entries(ICONS).map(([n, I]) => prop(`icon-${n.slice(4).toLowerCase()}`, <I s={96} />, '-50 -50 100 100')),
];

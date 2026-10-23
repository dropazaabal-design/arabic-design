import { registerRoot } from 'remotion';
import { loadFonts } from '../fonts';
import { PlacesPreview } from './PlacesPreview';

loadFonts();
registerRoot(PlacesPreview);

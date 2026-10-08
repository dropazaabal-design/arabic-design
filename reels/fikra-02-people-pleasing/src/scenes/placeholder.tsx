import React from 'react';
import { Stage } from '../Stage';
import { useEpisodeFrame } from '../time';

export const Placeholder: React.FC = () => <Stage f={useEpisodeFrame()} svg={null} />;

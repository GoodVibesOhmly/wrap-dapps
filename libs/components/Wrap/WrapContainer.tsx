import { Box, Container, Typography } from '@material-ui/core';
import {
  AmountToInputCard,
  DropDownCard,
  NextCard,
  ReceiveCard, TabsCard
} from './cards';
import { EthereumConnectionButton, TezosConnectionButton } from '../wallet';
import MultiConnect from '../wallet/MultiConnect';

export type WrapContainerProps = {
  connected: boolean;
};

export const WrapContainer = ({ connected }: WrapContainerProps) => {
  connected = false;
  return (
    <Container>
      <TabsCard />
      <MultiConnect />
      <DropDownCard />
      <AmountToInputCard />
      <ReceiveCard />
      <NextCard />
    </Container>
  );
};
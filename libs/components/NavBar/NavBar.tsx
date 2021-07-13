import React, { PropsWithChildren } from 'react';
import { AppBar, Toolbar } from '@material-ui/core';

export function NavBar({ children }: PropsWithChildren<{}>) {
  return (
    <AppBar>
      <Toolbar>{children}</Toolbar>
    </AppBar>
  );
}
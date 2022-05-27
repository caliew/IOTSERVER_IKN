import PropTypes from 'prop-types';
import React from 'react';
import { unit, font } from '@data-ui/theme';
import { black } from 'colors';

const spacerStyles = {
  ...font.regular,
  paddingTop: 5.0 * unit,
  paddingLeft: 3.0 * unit
};

export default function Title({ children }) {
  return <div style={spacerStyles}>{children}</div>;
}

Title.propTypes = {
  children: PropTypes.node.isRequired,
};

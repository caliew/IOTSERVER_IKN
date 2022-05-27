import PropTypes from 'prop-types';
import React from 'react';

import Spacer from './shared/Spacer';
import Title from './shared/Title';

export default function Example({ title, children }) {
  return (
    <Spacer flexDirection="row" right="1" left="1">
      <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
        <div>{title && <Title>{title}</Title>}</div>
        <div>{children}</div>
      </div>
    </Spacer>
  );
}

Example.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
};

Example.defaultProps = {
  title: null,
};

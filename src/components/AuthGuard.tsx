import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps extends RouteProps {
  component: React.ComponentType<any>;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ component: Component, ...rest }) => {
  const { isAuthenticated, loading } = useAuth();

  // If still loading, don't render anything
  if (loading) {
    return null;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
};

export default AuthGuard;
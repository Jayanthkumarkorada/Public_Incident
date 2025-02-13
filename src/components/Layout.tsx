import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { AccountCircle, DirectionsCar } from '@mui/icons-material';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    router.push('/profile');
    handleClose();
  };

  const navigateToArticles = () => {
    router.push('/articles');
  };

  const navigateToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <DirectionsCar sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
              Transport Incident Reporter
            </Link>
          </Typography>

          <Button
            color="inherit"
            onClick={navigateToArticles}
            sx={{ mr: 2 }}
          >
            Safety Resources
          </Button>
          
          {session ? (
            <>
              <Button
                color="inherit"
                onClick={navigateToDashboard}
                sx={{ mr: 2 }}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                onClick={() => router.push('/law-chatbot')}
                sx={{ mr: 2 }}
              >
                Legal Assistant
              </Button>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={() => router.push('/auth/signin')}
            >
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            {new Date().getFullYear()} Transport Incident Reporter. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

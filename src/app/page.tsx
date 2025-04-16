'use client';

import TaskInput from '@/components/TaskInput';
import TaskQuery from '@/components/TaskQuery';
import TaskList from '@/components/TaskList';
import { useAuth } from '@/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import SignUp from '@/components/SignUp';
import SignIn from '@/components/SignIn';
import { Toaster } from '@/components/ui/toaster';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from '@/components/ui/menubar';
import { TasksProvider } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Home() {
  const toast = useToast();
  const { user, signOut, loading: authLoading } = useAuth();
  const [openSignIn, setOpenSignIn] = useState(false);
  const [openSignUp, setOpenSignUp] = useState(false);

  if (authLoading) {
    return <div style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {user ?
        (<TasksProvider>
          <div className="flex justify-end mb-4">
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Me</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>{user.email}</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem><Button onClick={() => signOut()} className="ml-2">Sign Out</Button></MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start mb-4">
            <div className="w-full md:w-1/2 pr-2 mb-4">
              <TaskInput />
            </div>
            <div className="w-full md:w-1/2 pl-2">
              <TaskQuery />
            </div>
          </div>
          <TaskList />
        </TasksProvider>
        ) : (
          <div>
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Menu</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={() => setOpenSignIn(true)}>Sign In</MenubarItem>
                  <MenubarItem onClick={() => setOpenSignUp(true)}>Sign Up</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>

            <Dialog open={openSignIn} onOpenChange={setOpenSignIn}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sign In</DialogTitle>
                </DialogHeader>
                <SignIn />
              </DialogContent>
            </Dialog>

            <Dialog open={openSignUp} onOpenChange={setOpenSignUp}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sign Up</DialogTitle>
                </DialogHeader>
                <SignUp />
              </DialogContent>
            </Dialog>

          </div>
        )}
      <Toaster />
    </div>
  );
}

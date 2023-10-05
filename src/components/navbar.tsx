// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

'use client';

import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@nextui-org/navbar';
import { Button } from '@nextui-org/button';
import { Kbd } from '@nextui-org/kbd';
import { Link } from '@nextui-org/link';
import { Input } from '@nextui-org/input';

import { link as linkStyles } from '@nextui-org/theme';

import { siteConfig } from '@/config/site';
import NextLink from 'next/link';
import clsx from 'clsx';

import { ThemeSwitch } from '@/components/theme-switch';
import { GithubIcon, HeartFilledIcon, LoginIcon, SearchIcon } from '@/components/icons';
import { useDisclosure } from '@nextui-org/modal';
import LoginModal from './login-modal';
import { usePathname } from 'next/navigation';

export const Navbar = () => {
  const pathname = usePathname();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // const searchInput = (
  // 	<Input
  // 		aria-label="Search"
  // 		classNames={{
  // 			inputWrapper: "bg-default-100",
  // 			input: "text-sm",
  // 		}}
  // 		endContent={
  // 			<Kbd className="hidden lg:inline-block" keys={["command"]}>
  // 				K
  // 			</Kbd>
  // 		}
  // 		labelPlacement="outside"
  // 		placeholder="Search..."
  // 		startContent={
  // 			<SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
  // 		}
  // 		type="search"
  // 	/>
  // );

  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <p className="font-bold text-inherit">{siteConfig.navTitle}</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: (pathname + '/').startsWith(item.href) ? 'primary' : 'foreground' }),
                  'data-[active=true]:text-primary data-[active=true]:font-medium',
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="hidden lg:flex gap-2">
          <ThemeSwitch />
          <Link isExternal href={siteConfig.links.github} aria-label="Github">
            <GithubIcon className="text-default-500" />
          </Link>
          <Link aria-label="Login" className="cursor-pointer" onClick={onOpen}>
            <LoginIcon className="text-default-500" />
          </Link>
        </NavbarItem>
        {/* <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem> */}
        {/* <NavbarItem className="hidden md:flex">
					<Button
            isExternal
						as={Link}
						className="text-sm font-normal text-default-600 bg-default-100"
						href={siteConfig.links.sponsor}
						startContent={<HeartFilledIcon className="text-danger" />}
						variant="flat"
					>
						Sponsor
					</Button>
				</NavbarItem> */}
      </NavbarContent>

      <NavbarContent className="lg:hidden basis-1 pl-4" justify="end">
        <Link isExternal href={siteConfig.links.github} aria-label="Github">
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {/* {searchInput} */}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={item.label === 'Profile' ? 'primary' : item.label === 'Logout' ? 'danger' : 'foreground'}
                href="#"
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
      <LoginModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </NextUINavbar>
  );
};

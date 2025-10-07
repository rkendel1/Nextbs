import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    path: "/",
    newTab: false,
  },
  {
    id: 2,
    title: "About",
    path: "/about",
    newTab: false,
  },
  {
    id: 3,
    title: "Pricing",
    path: "/pricing",
    newTab: false,
  },
  {
    id: 4,
    title: "Dashboard",
    path: "/dashboard",
    newTab: false,
  },
  {
    id: 5,
    title: "Contact",
    path: "/contact",
    newTab: false,
  },
  {
    id: 6,
    title: "Blog",
    path: "/blogs",
    newTab: false,
  },
  {
    id: 7,
    title: "Pages",
    newTab: false,
    submenu: [
      {
        id: 71,
        title: "About Page",
        path: "/about",
        newTab: false,
      },
      {
        id: 72,
        title: "Pricing Page",
        path: "/pricing",
        newTab: false,
      },
      {
        id: 73,
        title: "Contact Page",
        path: "/contact",
        newTab: false,
      },
      {
        id: 74,
        title: "Blog Grid Page",
        path: "/blogs",
        newTab: false,
      },
      {
        id: 75,
        title: "Dashboard",
        path: "/dashboard",
        newTab: false,
      },
      {
        id: 76,
        title: "Onboarding",
        path: "/onboarding",
        newTab: false,
      },
      {
        id: 77,
        title: "Sign Up Page",
        path: "/signup",
        newTab: false,
      },
      {
        id: 78,
        title: "Sign In Page",
        path: "/signin",
        newTab: false,
      },
      {
        id: 79,
        title: "Error Page",
        path: "/error",
        newTab: false,
      },
    ],
  },
];
export default menuData;

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
    title: "Docs",
    path: "/docs",
    newTab: false,
  },
  {
    id: 6,
    title: "Contact",
    path: "/contact",
    newTab: false,
  },
  {
    id: 7,
    title: "Blog",
    path: "/blogs",
    newTab: false,
  },
  {
    id: 8,
    title: "Pages",
    newTab: false,
    submenu: [
      {
        id: 81,
        title: "About Page",
        path: "/about",
        newTab: false,
      },
      {
        id: 82,
        title: "Pricing Page",
        path: "/pricing",
        newTab: false,
      },
      {
        id: 83,
        title: "Contact Page",
        path: "/contact",
        newTab: false,
      },
      {
        id: 84,
        title: "Blog Grid Page",
        path: "/blogs",
        newTab: false,
      },
      {
        id: 85,
        title: "Dashboard",
        path: "/dashboard",
        newTab: false,
      },
      {
        id: 86,
        title: "Documentation",
        path: "/docs",
        newTab: false,
      },
      {
        id: 87,
        title: "Onboarding",
        path: "/onboarding",
        newTab: false,
      },
      {
        id: 88,
        title: "Sign Up Page",
        path: "/signup",
        newTab: false,
      },
      {
        id: 90,
        title: "Error Page",
        path: "/error",
        newTab: false,
      },
    ],
  },
];
export default menuData;

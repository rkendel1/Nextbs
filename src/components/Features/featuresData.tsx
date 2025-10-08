import { Feature } from "@/types/feature";

const featuresData: Feature[] = [
  {
    id: 1,
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 2L2 10L18 18L34 10L18 2Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M2 26L18 34L34 26"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 18L18 26L34 18"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "API Key Management",
    paragraph: "Generate, manage, and secure API keys for your SaaS products. Complete control over authentication with automatic key generation and revocation capabilities.",
    btn: "Learn More",
    btnLink: "/dashboard/api-keys",
  },
  {
    id: 2,
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30.5998 1.01245H5.39981C2.98105 1.01245 0.956055 2.9812 0.956055 5.4562V30.6562C0.956055 33.075 2.9248 35.0437 5.39981 35.0437H30.5998C33.0186 35.0437 34.9873 33.075 34.9873 30.6562V5.39995C34.9873 2.9812 33.0186 1.01245 30.5998 1.01245ZM5.39981 3.48745H30.5998C31.6123 3.48745 32.4561 4.3312 32.4561 5.39995V11.1937H3.4873V5.39995C3.4873 4.38745 4.38731 3.48745 5.39981 3.48745ZM3.4873 30.6V13.725H23.0623V32.5125H5.39981C4.38731 32.5125 3.4873 31.6125 3.4873 30.6ZM30.5998 32.5125H25.5373V13.725H32.4561V30.6C32.5123 31.6125 31.6123 32.5125 30.5998 32.5125Z"
          fill="white"
        />
      </svg>
    ),
    title: "White-Label Configuration",
    paragraph: "Customize your platform with your own branding, colors, logos, and custom domains. Create a seamless branded experience for your customers.",
    btn: "Learn More",
    btnLink: "/dashboard/white-label",
  },
  {
    id: 3,
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M32 4H4C2.9 4 2 4.9 2 6V30C2 31.1 2.9 32 4 32H32C33.1 32 34 31.1 34 30V6C34 4.9 33.1 4 32 4ZM32 30H4V10H32V30ZM8 14H12V26H8V14ZM14 18H18V26H14V18ZM20 22H24V26H20V22ZM26 16H30V26H26V16Z"
          fill="white"
        />
      </svg>
    ),
    title: "Advanced Analytics",
    paragraph: "Track revenue, user engagement, and subscription metrics with beautiful visualizations. Make data-driven decisions with comprehensive insights.",
    btn: "Learn More",
    btnLink: "/dashboard/analytics",
  },
  {
    id: 4,
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 4C10.268 4 4 10.268 4 18C4 25.732 10.268 32 18 32C25.732 32 32 25.732 32 18C32 10.268 25.732 4 18 4ZM18 6C24.627 6 30 11.373 30 18C30 24.627 24.627 30 18 30C11.373 30 6 24.627 6 18C6 11.373 11.373 6 18 6ZM17 10V19.414L23.293 25.707L24.707 24.293L19 18.586V10H17Z"
          fill="white"
        />
      </svg>
    ),
    title: "Subscription Management",
    paragraph: "Handle subscriptions, billing tiers, and customer lifecycle with ease. Automated subscription tracking and revenue management built-in.",
    btn: "Learn More",
    btnLink: "/dashboard/subscriptions",
  },
  {
    id: 5,
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 2C9.16 2 2 9.16 2 18C2 26.84 9.16 34 18 34C26.84 34 34 26.84 34 18C34 9.16 26.84 2 18 2ZM18 6C20.21 6 22 7.79 22 10C22 12.21 20.21 14 18 14C15.79 14 14 12.21 14 10C14 7.79 15.79 6 18 6ZM18 30C14 30 10.58 27.84 9 24.72C9.05 21.5 15.33 19.74 18 19.74C20.67 19.74 26.95 21.5 27 24.72C25.42 27.84 22 30 18 30Z"
          fill="white"
        />
      </svg>
    ),
    title: "User Management",
    paragraph: "Efficiently manage your SaaS customers with built-in user administration tools. Handle user roles, permissions, and access control with ease.",
    btn: "Learn More",
    btnLink: "/dashboard",
  },
  {
    id: 6,
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M28 6H8C5.8 6 4 7.8 4 10V26C4 28.2 5.8 30 8 30H28C30.2 30 32 28.2 32 26V10C32 7.8 30.2 6 28 6ZM28 10L18 17L8 10H28ZM28 26H8V12L18 19L28 12V26Z"
          fill="white"
        />
      </svg>
    ),
    title: "Email Integration",
    paragraph: "Built-in email service for transactional emails, notifications, and customer communications. Keep your users engaged and informed effortlessly.",
    btn: "Learn More",
    btnLink: "/dashboard",
  },
];
export default featuresData;

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
          d="M28 4H8C5.79 4 4 5.79 4 8V28C4 30.21 5.79 32 8 32H28C30.21 32 32 30.21 32 28V8C32 5.79 30.21 4 28 4ZM18 26C14.69 26 12 23.31 12 20C12 16.69 14.69 14 18 14C21.31 14 24 16.69 24 20C24 23.31 21.31 26 18 26ZM26 12C25.45 12 25 11.55 25 11C25 10.45 25.45 10 26 10C26.55 10 27 10.45 27 11C27 11.55 26.55 12 26 12Z"
          fill="white"
        />
        <circle cx="18" cy="20" r="4" fill="white" />
      </svg>
    ),
    title: "Platform Owner Dashboard",
    paragraph: "Monitor your entire SaaS ecosystem from a single dashboard. Platform-wide statistics, user management, and administrative controls at your fingertips.",
    btn: "Learn More",
    btnLink: "/dashboard/platform",
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

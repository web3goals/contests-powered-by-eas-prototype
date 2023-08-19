export type Contest = {
  organizer: `0x${string}`;
  title: string;
  description: string;
  judges: `0x${string}`[];
  participants: string[];
};

export type ProfileUriData = {
  name: string;
  image: string;
  attributes: [
    { trait_type: "name"; value: string },
    { trait_type: "about"; value: string },
    { trait_type: "email"; value: string },
    { trait_type: "website"; value: string },
    { trait_type: "twitter"; value: string },
    { trait_type: "telegram"; value: string },
    { trait_type: "instagram"; value: string }
  ];
};

export type PageMetaData = {
  url: string | undefined;
  title: string | undefined;
  description: string | undefined;
  image: string | undefined;
};

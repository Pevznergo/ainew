export default function Head() {
  const title =
    'Бонусы за комментарии — программа вознаграждений Aporto | ChatGPT бесплатно на русском';
  const description =
    'Получай бонусы за комментарии и приглашения друзей. Aporto — ChatGPT бесплатно на русском без VPN и иностранного номера. Присоединяйся к программе вознаграждений.';
  const url = 'https://aporto.tech/rewards';

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content="ru_RU" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </>
  );
}

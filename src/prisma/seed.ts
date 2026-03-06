import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  UserRole,
  PropertyStatus,
  PropertyType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BrazilianState } from '../common/enums/brazilian-state.enum';

const connectionString =
  process.env.DATABASE_URL ??
  process.env.APP_DATABASE_URL ??
  '';

if (!connectionString) {
  throw new Error(
    'DATABASE_URL não definida. Configure no .env antes de rodar o seed.',
  );
}

const adapter = new PrismaPg({
  connectionString,
  idleTimeoutMillis: 300_000,
  connectionTimeoutMillis: 10_000,
  max: 10,
});

const prisma = new PrismaClient({ adapter });

// ── Dados dos imóveis ───────────────────────────────────────────────

const properties = [
  // São Paulo
  {
    title: 'Apartamento moderno no centro',
    description: 'Apartamento de 2 dormitórios, totalmente reformado, perto do metrô. Piso laminado, cozinha planejada e varanda gourmet.',
    property_type: PropertyType.APARTAMENTO,
    price: 450_000, area: 68, bedrooms: 2,
    status: PropertyStatus.DISPONIVEL,
    street: 'Rua Barão de Itapetininga', number: '120',
    neighborhood: 'Centro', city: 'São Paulo', state: BrazilianState.SaoPaulo,
    postal_code: '01042-001', lat: -23.5440, lng: -46.6396,
  },
  {
    title: 'Casa térrea com quintal amplo',
    description: 'Casa térrea com 3 dormitórios e quintal grande, ideal para família com crianças e pets.',
    property_type: PropertyType.CASA,
    price: 650_000, area: 120, bedrooms: 3,
    status: PropertyStatus.DISPONIVEL,
    street: 'Rua Domingos de Morais', number: '850',
    neighborhood: 'Vila Mariana', city: 'São Paulo', state: BrazilianState.SaoPaulo,
    postal_code: '04010-100', lat: -23.5889, lng: -46.6388,
  },
  {
    title: 'Studio mobiliado próximo à Unicamp',
    description: 'Studio compacto de 32m², totalmente mobiliado, perfeito para estudantes e jovens profissionais.',
    property_type: PropertyType.APARTAMENTO,
    price: 280_000, area: 32, bedrooms: 1,
    status: PropertyStatus.DISPONIVEL,
    street: 'Rua Roxo Moreira', number: '45',
    neighborhood: 'Barão Geraldo', city: 'Campinas', state: BrazilianState.SaoPaulo,
    postal_code: '13083-590', lat: -22.8184, lng: -47.0647,
  },
  {
    title: 'Sala comercial na Berrini',
    description: 'Sala comercial com 45m² em prédio corporativo moderno, recepção e estacionamento rotativo.',
    property_type: PropertyType.COMERCIAL,
    price: 520_000, area: 45, bedrooms: 0,
    status: PropertyStatus.DISPONIVEL,
    street: 'Av. Engenheiro Luís Carlos Berrini', number: '1500',
    neighborhood: 'Brooklin', city: 'São Paulo', state: BrazilianState.SaoPaulo,
    postal_code: '04571-000', lat: -23.6008, lng: -46.6920,
  },
  {
    title: 'Chácara com área verde em Atibaia',
    description: 'Chácara com casa de 3 quartos, piscina, churrasqueira e ampla área verde para lazer.',
    property_type: PropertyType.RURAL,
    price: 750_000, area: 1500, bedrooms: 3,
    status: PropertyStatus.DISPONIVEL,
    street: 'Estrada Municipal', number: 'Km 8',
    neighborhood: 'Jardim Estância Brasil', city: 'Atibaia', state: BrazilianState.SaoPaulo,
    postal_code: '12954-000', lat: -23.1171, lng: -46.5505,
  },
  // Rio de Janeiro
  {
    title: 'Cobertura duplex no Leblon',
    description: 'Cobertura duplex com vista para o mar, 4 suítes, piscina privativa e 3 vagas de garagem.',
    property_type: PropertyType.APARTAMENTO,
    price: 3_200_000, area: 280, bedrooms: 4,
    status: PropertyStatus.DISPONIVEL,
    street: 'Av. Delfim Moreira', number: '200',
    neighborhood: 'Leblon', city: 'Rio de Janeiro', state: BrazilianState.RioDeJaneiro,
    postal_code: '22441-000', lat: -22.9868, lng: -43.2265,
  },
  {
    title: 'Apartamento em Copacabana',
    description: 'Apartamento 2 quartos a 2 quadras da praia, reformado, portaria 24h.',
    property_type: PropertyType.APARTAMENTO,
    price: 890_000, area: 75, bedrooms: 2,
    status: PropertyStatus.DISPONIVEL,
    street: 'Rua Barata Ribeiro', number: '502',
    neighborhood: 'Copacabana', city: 'Rio de Janeiro', state: BrazilianState.RioDeJaneiro,
    postal_code: '22040-002', lat: -22.9658, lng: -43.1789,
  },
  {
    title: 'Casa em Niterói com vista para a Baía',
    description: 'Casa ampla de 4 quartos com vista panorâmica para a Baía de Guanabara.',
    property_type: PropertyType.CASA,
    price: 1_100_000, area: 200, bedrooms: 4,
    status: PropertyStatus.VENDIDO,
    street: 'Rua Mariz e Barros', number: '310',
    neighborhood: 'Icaraí', city: 'Niterói', state: BrazilianState.RioDeJaneiro,
    postal_code: '24220-121', lat: -22.8982, lng: -43.1065,
  },
  // Minas Gerais
  {
    title: 'Apartamento na Savassi',
    description: 'Apartamento 3 dormitórios em condomínio com área de lazer completa, próximo ao Pátio Savassi.',
    property_type: PropertyType.APARTAMENTO,
    price: 580_000, area: 95, bedrooms: 3,
    status: PropertyStatus.DISPONIVEL,
    street: 'Rua Pernambuco', number: '1000',
    neighborhood: 'Savassi', city: 'Belo Horizonte', state: BrazilianState.MinasGerais,
    postal_code: '30130-150', lat: -19.9352, lng: -43.9345,
  },
  {
    title: 'Casa colonial em Ouro Preto',
    description: 'Casa colonial restaurada com 2 quartos, varanda e vista para as montanhas. Centro histórico.',
    property_type: PropertyType.CASA,
    price: 420_000, area: 110, bedrooms: 2,
    status: PropertyStatus.DISPONIVEL,
    street: 'Rua Conde de Bobadela', number: '75',
    neighborhood: 'Centro', city: 'Ouro Preto', state: BrazilianState.MinasGerais,
    postal_code: '35400-000', lat: -20.3856, lng: -43.5035,
  },
  // Paraná
  {
    title: 'Casa em condomínio no Batel',
    description: 'Casa 3 dormitórios em condomínio fechado, churrasqueira, garagem para 2 carros.',
    property_type: PropertyType.CASA,
    price: 720_000, area: 180, bedrooms: 3,
    status: PropertyStatus.DISPONIVEL,
    street: 'Rua Coronel Dulcídio', number: '630',
    neighborhood: 'Batel', city: 'Curitiba', state: BrazilianState.Parana,
    postal_code: '80420-170', lat: -25.4395, lng: -49.2890,
  },
  {
    title: 'Terreno em São José dos Pinhais',
    description: 'Terreno plano de 360m² em loteamento com infraestrutura completa, próximo ao aeroporto.',
    property_type: PropertyType.TERRENO,
    price: 195_000, area: 360, bedrooms: 0,
    status: PropertyStatus.DISPONIVEL,
    street: 'Rua das Araucárias', number: 'Lote 12',
    neighborhood: 'Afonso Pena', city: 'São José dos Pinhais', state: BrazilianState.Parana,
    postal_code: '83040-000', lat: -25.5310, lng: -49.1760,
  },
  // Santa Catarina
  {
    title: 'Apartamento frente mar em Balneário Camboriú',
    description: 'Apartamento alto padrão, 3 suítes, sacada com vista para o mar, condomínio com piscina.',
    property_type: PropertyType.APARTAMENTO,
    price: 1_850_000, area: 140, bedrooms: 3,
    status: PropertyStatus.DISPONIVEL,
    street: 'Av. Atlântica', number: '3500',
    neighborhood: 'Centro', city: 'Balneário Camboriú', state: BrazilianState.SantaCatarina,
    postal_code: '88330-025', lat: -26.9906, lng: -48.6348,
  },
  // Bahia
  {
    title: 'Casa de praia em Trancoso',
    description: 'Casa com 4 suítes, piscina, a 300m da praia. Ideal para temporada ou moradia.',
    property_type: PropertyType.CASA,
    price: 2_100_000, area: 250, bedrooms: 4,
    status: PropertyStatus.DISPONIVEL,
    street: 'Estrada Arraial-Trancoso', number: 'S/N',
    neighborhood: 'Trancoso', city: 'Porto Seguro', state: BrazilianState.Bahia,
    postal_code: '45818-000', lat: -16.5898, lng: -39.0945,
  },
  // Rio Grande do Sul
  {
    title: 'Apartamento no Moinhos de Vento',
    description: 'Apartamento 2 dormitórios em bairro nobre, próximo ao Parcão. Portaria 24h.',
    property_type: PropertyType.APARTAMENTO,
    price: 620_000, area: 82, bedrooms: 2,
    status: PropertyStatus.DISPONIVEL,
    street: 'Rua Padre Chagas', number: '180',
    neighborhood: 'Moinhos de Vento', city: 'Porto Alegre', state: BrazilianState.RioGrandeDoSul,
    postal_code: '90570-080', lat: -30.0257, lng: -51.2003,
  },
  // Goiás
  {
    title: 'Sala comercial no Setor Bueno',
    description: 'Sala de 60m² em edifício comercial com estacionamento, próximo ao Flamboyant.',
    property_type: PropertyType.COMERCIAL,
    price: 380_000, area: 60, bedrooms: 0,
    status: PropertyStatus.DISPONIVEL,
    street: 'Av. T-10', number: '1200',
    neighborhood: 'Setor Bueno', city: 'Goiânia', state: BrazilianState.Goias,
    postal_code: '74223-060', lat: -16.7056, lng: -49.2633,
  },
  // Distrito Federal
  {
    title: 'Apartamento na Asa Sul',
    description: 'Apartamento 3 quartos na SQS 308, próximo ao metrô e ao Parque da Cidade.',
    property_type: PropertyType.APARTAMENTO,
    price: 750_000, area: 100, bedrooms: 3,
    status: PropertyStatus.DISPONIVEL,
    street: 'SQS 308 Bloco A', number: '201',
    neighborhood: 'Asa Sul', city: 'Brasília', state: BrazilianState.DistritoFederal,
    postal_code: '70358-010', lat: -15.8267, lng: -47.9218,
  },
  // Pernambuco
  {
    title: 'Flat em Boa Viagem',
    description: 'Flat mobiliado com 1 suíte, serviços de hotel, na beira-mar de Boa Viagem.',
    property_type: PropertyType.APARTAMENTO,
    price: 340_000, area: 40, bedrooms: 1,
    status: PropertyStatus.DISPONIVEL,
    street: 'Av. Boa Viagem', number: '4000',
    neighborhood: 'Boa Viagem', city: 'Recife', state: BrazilianState.Pernambuco,
    postal_code: '51021-000', lat: -8.1196, lng: -34.8967,
  },
  // Ceará
  {
    title: 'Casa no Eusébio',
    description: 'Casa 3 suítes em condomínio fechado com lazer completo, próximo ao Beach Park.',
    property_type: PropertyType.CASA,
    price: 560_000, area: 160, bedrooms: 3,
    status: PropertyStatus.RASCUNHO,
    street: 'Rua Desembargador Moreira', number: '500',
    neighborhood: 'Eusébio', city: 'Eusébio', state: BrazilianState.Ceara,
    postal_code: '61760-000', lat: -3.8890, lng: -38.4507,
  },
  // Vendido – variação
  {
    title: 'Apartamento vendido na Vila Madalena',
    description: 'Apartamento 1 dormitório, bem localizado na Vila Madalena. (Já vendido.)',
    property_type: PropertyType.APARTAMENTO,
    price: 390_000, area: 45, bedrooms: 1,
    status: PropertyStatus.VENDIDO,
    street: 'Rua Girassol', number: '300',
    neighborhood: 'Vila Madalena', city: 'São Paulo', state: BrazilianState.SaoPaulo,
    postal_code: '05433-001', lat: -23.5530, lng: -46.6920,
  },
];

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('🟡 Iniciando seed...\n');

  const plainPassword = 'senha123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // ── Corretor ──────────────────────────────────────────────────────
  const corretorEmail = 'corretor@quickimoveis.com';
  const corretor = await prisma.user.upsert({
    where: { email: corretorEmail },
    update: {},
    create: {
      email: corretorEmail,
      password: hashedPassword,
      name: 'Carlos Mendes',
      role: UserRole.CORRETOR,
      creci: '12345-F',
      phone: '11999998888',
      whatsapp: '5511999998888',
      is_active: true,
      is_email_verified: true,
    },
  });
  console.log('✅ Corretor:', corretor.email);

  // Endereço do corretor
  await prisma.userAddress.upsert({
    where: { user_id: corretor.id },
    update: {},
    create: {
      user_id: corretor.id,
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: BrazilianState.SaoPaulo,
      country: 'Brasil',
      postal_code: '01310-100',
      lat: -23.5632,
      lng: -46.6542,
    },
  });

  // ── Segundo corretor ──────────────────────────────────────────────
  const corretor2Email = 'maria.corretor@quickimoveis.com';
  const corretor2 = await prisma.user.upsert({
    where: { email: corretor2Email },
    update: {},
    create: {
      email: corretor2Email,
      password: hashedPassword,
      name: 'Maria Oliveira',
      role: UserRole.CORRETOR,
      creci: '67890-F',
      phone: '21988887777',
      whatsapp: '5521988887777',
      is_active: true,
      is_email_verified: true,
    },
  });
  console.log('✅ Corretor 2:', corretor2.email);

  await prisma.userAddress.upsert({
    where: { user_id: corretor2.id },
    update: {},
    create: {
      user_id: corretor2.id,
      street: 'Rua Visconde de Pirajá',
      number: '330',
      neighborhood: 'Ipanema',
      city: 'Rio de Janeiro',
      state: BrazilianState.RioDeJaneiro,
      country: 'Brasil',
      postal_code: '22410-003',
      lat: -22.9838,
      lng: -43.2045,
    },
  });

  // ── Comprador ─────────────────────────────────────────────────────
  const compradorEmail = 'comprador@quickimoveis.com';
  const comprador = await prisma.user.upsert({
    where: { email: compradorEmail },
    update: {},
    create: {
      email: compradorEmail,
      password: hashedPassword,
      name: 'João Silva',
      role: UserRole.COMPRADOR,
      is_active: true,
      is_email_verified: true,
      renda_mensal: 8_000,
      valor_entrada: 80_000,
    },
  });
  console.log('✅ Comprador:', comprador.email);

  // Endereço do comprador (necessário para recomendações)
  await prisma.userAddress.upsert({
    where: { user_id: comprador.id },
    update: {},
    create: {
      user_id: comprador.id,
      street: 'Rua Augusta',
      number: '500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: BrazilianState.SaoPaulo,
      country: 'Brasil',
      postal_code: '01304-001',
      lat: -23.5534,
      lng: -46.6573,
    },
  });

  // ── Limpar dados antigos ──────────────────────────────────────────
  await prisma.favorite.deleteMany();
  await prisma.property.deleteMany();
  console.log('\n🧹 Dados antigos removidos');

  // ── Criar imóveis ─────────────────────────────────────────────────
  const corretores = [corretor, corretor2];
  const createdProperties: { id: string; title: string; status: string }[] = [];

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    // Alterna entre os dois corretores
    const owner = corretores[i % corretores.length];

    const created = await prisma.property.create({
      data: {
        owner: { connect: { id: owner.id } },
        title: p.title,
        description: p.description,
        property_type: p.property_type,
        price: p.price,
        area: p.area,
        bedrooms: p.bedrooms,
        status: p.status,
        address: {
          create: {
            street: p.street,
            number: p.number,
            neighborhood: p.neighborhood,
            city: p.city,
            state: p.state,
            country: 'Brasil',
            postal_code: p.postal_code,
            lat: p.lat,
            lng: p.lng,
          },
        },
      },
    });
    createdProperties.push({ id: created.id, title: p.title, status: p.status });
  }

  console.log(`✅ ${createdProperties.length} imóveis criados`);

  // ── Favoritos do comprador ────────────────────────────────────────
  const disponiveis = createdProperties.filter((p) => p.status === 'DISPONIVEL');
  const favoritosIds = disponiveis.slice(0, 4).map((p) => p.id);

  for (const propertyId of favoritosIds) {
    await prisma.favorite.create({
      data: {
        user_id: comprador.id,
        listing_id: propertyId,
      },
    });
  }

  console.log(`✅ ${favoritosIds.length} favoritos do comprador criados`);

  // ── Comentários em imóveis ────────────────────────────────────────
  await prisma.propertyComment.deleteMany();
  await prisma.corretorComment.deleteMany();

  const propertyComments = [
    { content: 'Ótima localização, perto de tudo!', rating: 5 },
    { content: 'Achei o preço um pouco acima do mercado, mas o imóvel é bonito.', rating: 3 },
    { content: 'Visitei e gostei muito da planta do apartamento.', rating: 4 },
    { content: 'O condomínio tem boa infraestrutura.', rating: 4 },
  ];

  for (let i = 0; i < Math.min(propertyComments.length, disponiveis.length); i++) {
    await prisma.propertyComment.create({
      data: {
        author_id: comprador.id,
        property_id: disponiveis[i].id,
        content: propertyComments[i].content,
        rating: propertyComments[i].rating,
      },
    });
  }
  console.log(`✅ ${Math.min(propertyComments.length, disponiveis.length)} comentários em imóveis criados`);

  // ── Comentários em corretores ─────────────────────────────────────
  await prisma.corretorComment.create({
    data: {
      author_id: comprador.id,
      corretor_id: corretor.id,
      content: 'Carlos foi muito atencioso e profissional na visita ao imóvel.',
      rating: 5,
    },
  });
  await prisma.corretorComment.create({
    data: {
      author_id: comprador.id,
      corretor_id: corretor2.id,
      content: 'Maria respondeu rápido e tirou todas as minhas dúvidas.',
      rating: 4,
    },
  });
  console.log('✅ 2 comentários em corretores criados');

  // ── Resumo ────────────────────────────────────────────────────────
  const byStatus = {
    DISPONIVEL: createdProperties.filter((p) => p.status === 'DISPONIVEL').length,
    VENDIDO: createdProperties.filter((p) => p.status === 'VENDIDO').length,
    RASCUNHO: createdProperties.filter((p) => p.status === 'RASCUNHO').length,
  };

  console.log('\n📊 Resumo:');
  console.log(`   Imóveis: ${createdProperties.length} (${byStatus.DISPONIVEL} disponíveis, ${byStatus.VENDIDO} vendidos, ${byStatus.RASCUNHO} rascunhos)`);
  console.log(`   Corretores: 2 | Comprador: 1 | Favoritos: ${favoritosIds.length} | Comentários: ${Math.min(propertyComments.length, disponiveis.length) + 2}`);
  console.log('\n🔐 Credenciais (senha igual para todos):');
  console.log(`   Corretor 1: ${corretorEmail}`);
  console.log(`   Corretor 2: ${corretor2Email}`);
  console.log(`   Comprador:  ${compradorEmail}`);
  console.log(`   Senha:      ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


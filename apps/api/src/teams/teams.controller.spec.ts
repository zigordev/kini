import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

const service = {
  listTeams: vi.fn(),
  createTeam: vi.fn(),
  inviteUser: vi.fn(),
  acceptInvitation: vi.fn(),
};

const sessionUser = {
  id: 'user-1',
  email: 'owner@example.com',
  name: 'Owner',
  language: 'en',
};
const teamId = '2f8c1e4a-9b3d-4f21-8e77-1a2b3c4d5e6f';

describe('TeamsController over HTTP', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [{ provide: TeamsService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: any, _res: unknown, next: () => void) => {
      const authenticated = req.headers['x-test-session'] === 'valid';
      req.isAuthenticated = () => authenticated;
      if (authenticated) req.user = sessionUser;
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service.listTeams.mockResolvedValue([]);
    service.inviteUser.mockResolvedValue({
      success: true,
      message: 'Invitation sent successfully',
    });
  });

  it('refuses every route without a session, before the service is asked', async () => {
    const response = await request(app.getHttpServer()).get('/teams');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTH.NOT_AUTHENTICATED');
    expect(service.listTeams).not.toHaveBeenCalled();
  });

  it('hands the session user to the service, not whatever the body claims', async () => {
    const response = await request(app.getHttpServer())
      .get('/teams')
      .set('x-test-session', 'valid');

    expect(response.status).toBe(200);
    expect(service.listTeams).toHaveBeenCalledWith(sessionUser);
  });

  it('refuses a malformed team id before the service is asked', async () => {
    const response = await request(app.getHttpServer())
      .post('/teams/not-a-uuid/invite')
      .set('x-test-session', 'valid')
      .send({ email: 'friend@example.com' });

    expect(response.status).toBe(400);
    expect(service.inviteUser).not.toHaveBeenCalled();
  });

  it('refuses an invitation to something that is not an email address', async () => {
    const response = await request(app.getHttpServer())
      .post(`/teams/${teamId}/invite`)
      .set('x-test-session', 'valid')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(service.inviteUser).not.toHaveBeenCalled();
  });

  it('forwards a well-formed invitation with the session user as inviter', async () => {
    const response = await request(app.getHttpServer())
      .post(`/teams/${teamId}/invite`)
      .set('x-test-session', 'valid')
      .send({ email: 'friend@example.com' });

    expect(response.status).toBe(201);
    expect(service.inviteUser).toHaveBeenCalledWith(
      teamId,
      'friend@example.com',
      sessionUser,
    );
  });
});

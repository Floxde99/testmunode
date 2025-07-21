const request = require("supertest");
const app = require("../src/server.js");

describe('API Users Tests', () => {
    // Reset des données avant chaque test
    beforeEach(async () => {
        await request(app).post('/test/reset');
    });

    describe('POST /users - Création d\'utilisateur', () => {
        it("create user with good value", async () => {
            const res = await request(app)
                .post('/users')
                .send({ name: "flo", email: "flo@live.fr" });
            
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe("flo");
            expect(res.body.email).toBe("flo@live.fr");
            expect(typeof res.body.id).toBe('number');
        });

        it("create user with bad value - missing name", async () => {
            const res = await request(app)
                .post('/users')
                .send({ email: "flo@live.fr" });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Missing fields');
        });

        it("create user with bad value - missing email", async () => {
            const res = await request(app)
                .post('/users')
                .send({ name: "flo" });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Missing fields');
        });

        it("create user with bad value - missing both fields", async () => {
            const res = await request(app)
                .post('/users')
                .send({});
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Missing fields');
        });

        it("create multiple users with incremental IDs", async () => {
            const user1 = await request(app)
                .post('/users')
                .send({ name: "user1", email: "user1@test.com" });
            
            const user2 = await request(app)
                .post('/users')
                .send({ name: "user2", email: "user2@test.com" });
            
            expect(user1.body.id).toBe(1);
            expect(user2.body.id).toBe(2);
        });
    });

    describe('GET /users - Récupération de tous les utilisateurs', () => {
        it("get empty users list", async () => {
            const res = await request(app).get('/users');
            
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("get users list with one user", async () => {
            // Créer un utilisateur d'abord
            await request(app)
                .post('/users')
                .send({ name: "test", email: "test@test.com" });
            
            const res = await request(app).get('/users');
            
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toEqual({
                id: 1,
                name: "test",
                email: "test@test.com"
            });
        });

        it("get users list with multiple users", async () => {
            // Créer plusieurs utilisateurs
            await request(app)
                .post('/users')
                .send({ name: "user1", email: "user1@test.com" });
            await request(app)
                .post('/users')
                .send({ name: "user2", email: "user2@test.com" });
            
            const res = await request(app).get('/users');
            
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
        });
    });

    describe('GET /users/:id - Récupération d\'un utilisateur par ID', () => {
        it("get existing user by ID", async () => {
            // Créer un utilisateur d'abord
            const createRes = await request(app)
                .post('/users')
                .send({ name: "test", email: "test@test.com" });
            
            const res = await request(app).get(`/users/${createRes.body.id}`);
            
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                id: createRes.body.id,
                name: "test",
                email: "test@test.com"
            });
        });

        it("get non-existing user by ID", async () => {
            const res = await request(app).get('/users/999');
            
            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('User not found');
        });

        it("get user with invalid ID format", async () => {
            const res = await request(app).get('/users/abc');
            
            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('User not found');
        });
    });

    describe('PUT /users/:id - Modification d\'un utilisateur', () => {
        let userId;

        beforeEach(async () => {
            const createRes = await request(app)
                .post('/users')
                .send({ name: "original", email: "original@test.com" });
            userId = createRes.body.id;
        });

        it("update user name only", async () => {
            const res = await request(app)
                .put(`/users/${userId}`)
                .send({ name: "updated" });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe("updated");
            expect(res.body.email).toBe("original@test.com");
            expect(res.body.id).toBe(userId);
        });

        it("update user email only", async () => {
            const res = await request(app)
                .put(`/users/${userId}`)
                .send({ email: "updated@test.com" });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe("original");
            expect(res.body.email).toBe("updated@test.com");
            expect(res.body.id).toBe(userId);
        });

        it("update user name and email", async () => {
            const res = await request(app)
                .put(`/users/${userId}`)
                .send({ name: "updated", email: "updated@test.com" });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe("updated");
            expect(res.body.email).toBe("updated@test.com");
            expect(res.body.id).toBe(userId);
        });

        it("update non-existing user", async () => {
            const res = await request(app)
                .put('/users/999')
                .send({ name: "updated" });
            
            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('User not found');
        });

        it("update user with empty body", async () => {
            const res = await request(app)
                .put(`/users/${userId}`)
                .send({});
            
            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe("original");
            expect(res.body.email).toBe("original@test.com");
        });
    });

    describe('DELETE /users/:id - Suppression d\'un utilisateur', () => {
        let userId;

        beforeEach(async () => {
            const createRes = await request(app)
                .post('/users')
                .send({ name: "to_delete", email: "delete@test.com" });
            userId = createRes.body.id;
        });

        it("delete existing user", async () => {
            const res = await request(app).delete(`/users/${userId}`);
            
            expect(res.statusCode).toBe(204);
            expect(res.body).toEqual({});
            
            // Vérifier que l'utilisateur a bien été supprimé
            const getRes = await request(app).get(`/users/${userId}`);
            expect(getRes.statusCode).toBe(404);
        });

        it("delete non-existing user", async () => {
            const res = await request(app).delete('/users/999');
            
            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('User not found');
        });

        it("verify user list after deletion", async () => {
            // Créer un autre utilisateur
            await request(app)
                .post('/users')
                .send({ name: "keeper", email: "keep@test.com" });
            
            // Supprimer le premier utilisateur
            await request(app).delete(`/users/${userId}`);
            
            // Vérifier que seul le second utilisateur reste
            const res = await request(app).get('/users');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe("keeper");
        });
    });

    describe('POST /test/reset - Reset des données', () => {
        it("reset clears all users", async () => {
            // Créer quelques utilisateurs
            await request(app)
                .post('/users')
                .send({ name: "user1", email: "user1@test.com" });
            await request(app)
                .post('/users')
                .send({ name: "user2", email: "user2@test.com" });
            
            // Vérifier qu'ils existent
            let res = await request(app).get('/users');
            expect(res.body).toHaveLength(2);
            
            // Reset
            const resetRes = await request(app).post('/test/reset');
            expect(resetRes.statusCode).toBe(204);
            
            // Vérifier que la liste est vide
            res = await request(app).get('/users');
            expect(res.body).toHaveLength(0);
        });

        it("reset restarts ID counter", async () => {
            // Créer un utilisateur
            await request(app)
                .post('/users')
                .send({ name: "user1", email: "user1@test.com" });
            
            // Reset
            await request(app).post('/test/reset');
            
            // Créer un nouvel utilisateur après reset
            const res = await request(app)
                .post('/users')
                .send({ name: "new_user", email: "new@test.com" });
            
            expect(res.body.id).toBe(1); // ID recommence à 1
        });
    });

    describe('Tests d\'intégration - Scénarios complets', () => {
        it("complete CRUD scenario", async () => {
            // 1. Créer un utilisateur
            const createRes = await request(app)
                .post('/users')
                .send({ name: "crud_test", email: "crud@test.com" });
            expect(createRes.statusCode).toBe(201);
            const userId = createRes.body.id;
            
            // 2. Lire l'utilisateur
            const readRes = await request(app).get(`/users/${userId}`);
            expect(readRes.statusCode).toBe(200);
            expect(readRes.body.name).toBe("crud_test");
            
            // 3. Modifier l'utilisateur
            const updateRes = await request(app)
                .put(`/users/${userId}`)
                .send({ name: "crud_updated" });
            expect(updateRes.statusCode).toBe(200);
            expect(updateRes.body.name).toBe("crud_updated");
            
            // 4. Supprimer l'utilisateur
            const deleteRes = await request(app).delete(`/users/${userId}`);
            expect(deleteRes.statusCode).toBe(204);
            
            // 5. Vérifier que l'utilisateur n'existe plus
            const finalRes = await request(app).get(`/users/${userId}`);
            expect(finalRes.statusCode).toBe(404);
        });
    });
});

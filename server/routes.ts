import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Category, Collectioning, Friending, IndexToCategory, Leveling, Posting, Sessioning, Summarizing, Trackering } from "./app";
import { Role } from "./concepts/authenticating";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";
import { NotFoundError } from "./concepts/errors";

const CategorySchema = z.enum([Category.Lifestyle, Category.HealthAndFitness, Category.Entertainment, Category.FoodAndCooking, Category.FashionAndBeauty, Category.EducationAndDIY]);
const RoleSchema = z.enum([Role.RegularUser, Role.ContentCreator]);
const PostOptionsSchema = z.object({
  backgroundColor: z.string().optional(),
});

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/role")
  async getUserRole(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserRole(user);
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string, role: Role) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password, role);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    // delete default collections
    const defaults = await Authing.getDefaults(user);
    for (const collection of defaults) {
      await Collectioning.deleteCollection(user, (await Collectioning.getCollectionById(collection)).title);
    }
    // delete collections
    await Collectioning.deleteCollections(user);
    // delete trackers
    await Trackering.deleteTrackers(user);
    // remove friends
    const friends = await Friending.getFriends(user);
    for (const friend of friends) {
      await Friending.removeFriend(user, friend);
    }
    // delete summary data
    await Summarizing.deleteSummary(user);
    // delete leveling data
    await Leveling.deleteLevel(user);
    // end session
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    try {
      const lifestyle = (await Collectioning.createCollection(u._id, Category.Root, "Lifestyle")).collection;
      const health = (await Collectioning.createCollection(u._id, Category.Root, "HealthAndFitness")).collection;
      const entertainment = (await Collectioning.createCollection(u._id, Category.Root, "Entertainment")).collection;
      const food = (await Collectioning.createCollection(u._id, Category.Root, "FoodAndCooking")).collection;
      const fashion = (await Collectioning.createCollection(u._id, Category.Root, "FashionAndBeauty")).collection;
      const education = (await Collectioning.createCollection(u._id, Category.Root, "EducationAndDIY")).collection;
      await Authing.setDefaults(u._id, [lifestyle!._id, health!._id, entertainment!._id, food!._id, fashion!._id, education!._id]);
    } catch (_) {
      return;
    }
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/users/contentcreators")
  async getContentCreators() {
    return await Authing.getUsersByRole(Role.ContentCreator);
  }

  @Router.get("/users/regularusers")
  async getRegularUsers() {
    return await Authing.getUsersByRole(Role.RegularUser);
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional(), category: z.string().optional(), role: z.string().optional() }))
  async getPosts(author?: string, category?: string, role?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    if (category) {
      if (category !== "All") posts = posts.filter((post) => post.category === category);
      //throw new Error("author, category, role:" + posts + author + category + role);
    }
    if (role) {
      posts = await Promise.all(posts.filter(async (post) => (await Authing.getUserRole(post.author)) === role));
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, category: Category, options?: PostOptions) {
    console.log("Session:", session, content, category, options);
    // If category is not one of the specified categories, the post gets automatically assigned to the root category.
    const defaultCategories = ["Lifestyle", "HealthAndFitness", "Entertainment", "FoodAndCooking", "FashionAndBeauty", "EducationAndDIY"];
    // if (defaultCategories.filter((str) => str === category).length <= 0) category = Category.Root;
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, category, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, category?: Category, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, category, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const friends = await Authing.idsToUsernames(await Friending.getFriends(user));
    return { friends, msg: "Successfully retrieved friends list." };
  }

  @Router.get("/friends/followers")
  async getFollowers(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Promise.all((await Friending.getFriends(user)).filter(async (friend) => (await Authing.getUserRole(friend)) !== Role.ContentCreator)));
  }

  @Router.get("/friends/followings")
  async getFollowings(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Promise.all((await Friending.getFriends(user)).filter(async (friend) => (await Authing.getUserRole(friend)) === Role.ContentCreator)));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    await Friending.removeFriend(user, friendOid);
    return { msg: `Successfully removed ${friend} from your friends.` };
  }

  @Router.post("/friends/follow")
  async followContentCreator(user: string, contentCreator: string) {
    const user1 = (await Authing.getUserByUsername(user))._id;
    const user2 = (await Authing.getUserByUsername(contentCreator))._id;
    if ((await Authing.getUserRole(user1)) === Role.RegularUser) {
      await Friending.addFriend(user1, user2);
      return { msg: `Successfully followed ${contentCreator}.` };
    }
    return { msg: "You must be a regular user to follow other users." };
  }

  @Router.post("/friends/unfollow")
  async unfollowContentCreator(user: string, friend: string) {
    const userid = (await Authing.getUserByUsername(user))._id;
    const friendid = (await Authing.getUserByUsername(friend))._id;
    if ((await Authing.getUserRole(userid)) === Role.RegularUser) {
      await Friending.removeFriend(userid, friendid);
      return { msg: `Successfully unfollowed ${friend}.` };
    }
    return { msg: "You must be a regular user to follow other users." };
  }

  @Router.get("/friends/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const requests = await Responses.friendRequests(await Friending.getRequests(user));
    return { requests, msg: "Successfully retrieved friend requests." };
  }

  @Router.post("/friends/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    await Friending.sendRequest(user, toOid);
    return { msg: `Friend request sent to ${to}.` };
  }

  @Router.delete("/friends/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    await Friending.removeRequest(user, toOid);
    return { msg: `Friend request to ${to} has been removed.` };
  }

  @Router.put("/friends/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    await Friending.acceptRequest(fromOid, user);
    return { msg: `Successfully accepted friend request from ${from}.` };
  }

  @Router.put("/friends/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    await Friending.rejectRequest(fromOid, user);
    return { msg: `Successfully rejected friend request from ${from}.` };
  }

  @Router.patch("/posts/increment/:id")
  async incrementPostQuality(id: ObjectId) {
    return await Posting.incrementQualityRating(id);
  }

  @Router.patch("/posts/decrement/:id")
  async decrementPostQuality(id: ObjectId) {
    return await Posting.decrementQualityRating(id);
  }

  @Router.get("/posts/:author")
  async getAuthorPosts(author: string) {
    const authorid = (await Authing.getUserByUsername(author))._id;
    return await Posting.getByAuthor(authorid);
  }

  @Router.patch("/posts/:category")
  @Router.validate(z.object({ category: CategorySchema }))
  async getPostsInCategory(category: Category) {
    return await Posting.getByCategory(category);
  }

  @Router.post("/trackers/create")
  async createTracker(session: SessionDoc, title: string) {
    const owner = Sessioning.getUser(session);
    return await Trackering.makeTracker(owner, title);
  }

  @Router.post("/collections/create")
  async createCollection(session: SessionDoc, parent: Category, title: string, deadline: string) {
    const defaultCategories = ["Lifestyle", "HealthAndFitness", "Entertainment", "FoodAndCooking", "FashionAndBeauty", "EducationAndDIY"];
    // if parent is not a default Category, it gets put into the default category Lifestyle
    if (defaultCategories.filter((str) => str === parent).length <= 0) parent = Category.Lifestyle;
    const owner = Sessioning.getUser(session);
    return await Collectioning.createCollection(owner, parent, title, deadline);
  }

  @Router.get("/trackers")
  async getAllTrackers(session: SessionDoc) {
    const owner = Sessioning.getUser(session);
    return await Trackering.getTrackers(owner);
  }

  @Router.get("/collections")
  async getAllCollections(session: SessionDoc) {
    const owner = Sessioning.getUser(session);
    return await Collectioning.getUserCollections(owner);
  }

  @Router.get("/trackers/:title")
  /**
   * Given an owner and title of a tracker, returns trackers of the same title that are shared with the owner.
   */
  async getSharedTrackers(user: string, title: string) {
    const owner = (await Authing.getUserByUsername(user))._id;
    return await Promise.all(
      (await Trackering.getSharedTrackers(owner)).filter(async (tracker) => {
        const trackerObj = await Trackering.getTrackerById(tracker);
        if (trackerObj) {
          return trackerObj.title === title;
        }
        return false;
      }),
    );
  }

  @Router.get("/collections/shared/:title")
  /**
   * Given an owner and title of a collection, returns collections of the same title that are shared with the owner.
   */
  async getSharedCollections(user: string, title: string) {
    const owner = (await Authing.getUserByUsername(user))._id;
    return await Promise.all(
      (await Collectioning.getSharedCollections(owner)).filter(async (collection) => {
        const collectionObj = await Collectioning.getCollectionById(collection);
        if (collectionObj) {
          return collectionObj.title === title;
        }
        return false;
      }),
    );
  }

  @Router.post("/trackers/share")
  async shareTracker(session: SessionDoc, to: string, title: string) {
    const toId = (await Authing.getUserByUsername(to))._id;
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      return await Trackering.shareTracker(user, title, toId);
    }
  }

  @Router.post("/collections/share")
  async shareCollection(session: SessionDoc, to: string, title: string) {
    const toId = (await Authing.getUserByUsername(to))._id;
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      return await Collectioning.shareCollection(user, title, toId);
    }
  }

  @Router.post("/trackers/unshare")
  async unshareTracker(session: SessionDoc, from: string, title: string) {
    const fromId = (await Authing.getUserByUsername(from))._id;
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      return await Trackering.unshareTracker(user, title, fromId);
    }
  }

  @Router.post("/collections/unshare")
  async unshareCollection(session: SessionDoc, from: string, title: string) {
    const fromId = (await Authing.getUserByUsername(from))._id;
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      return await Collectioning.unshareCollection(user, title, fromId);
    }
  }

  @Router.delete("/trackers")
  async deleteTracker(session: SessionDoc, title: string) {
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      return await Trackering.deleteTracker(user, title);
    }
  }

  @Router.delete("/collections")
  async deleteCollection(session: SessionDoc, title: string) {
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      return await Collectioning.deleteCollection(user, title);
    }
  }

  @Router.patch("/trackers/:title/check")
  @Router.validate(z.object({ title: z.string(), day: z.number().min(0).max(364) }))
  async checkTracker(session: SessionDoc, title: string, day: number) {
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      await Trackering.checkDay(user, title, day);
      const source = await Promise.all((await Trackering.getTrackers(user)).map(async (tracker) => await Trackering.getTotalCheckedDays(user, tracker.title)));
      await Leveling.updateExp(user, source);
    }
  }

  @Router.patch("/trackers/:title/uncheck")
  @Router.validate(z.object({ title: z.string(), day: z.number().min(0).max(364) }))
  async uncheckTracker(session: SessionDoc, title: string, day: number) {
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      await Trackering.uncheckDay(user, title, day);
      const source = await Promise.all((await Trackering.getTrackers(user)).map(async (tracker) => await Trackering.getTotalCheckedDays(user, tracker.title)));
      await Leveling.updateExp(user, source);
    }
  }

  /**
   *
   * @param id id of a default category
   * @returns
   */
  @Router.get("/collections/:title")
  async getPostsInCollection(session: SessionDoc, title: string) {
    const user = Sessioning.getUser(session);
    const collection = await Collectioning.getCollectionByTitle(user, title);
    return await Collectioning.getContent(collection._id);
  }

  @Router.patch("/collections/add")
  async addToCollection(session: SessionDoc, collectionTitle: string, post: ObjectId) {
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      await Collectioning.addToCollection(user, collectionTitle, post);
      const defaultCategories = ["Lifestyle", "HealthAndFitness", "Entertainment", "FoodAndCooking", "FashionAndBeauty", "EducationAndDIY"];
      let categories = new Array<number>();
      for (let category of defaultCategories) {
        const collections = await Collectioning.getUserCollections(user);
        let sum = 0;
        if (!(collections instanceof NotFoundError)) {
          for (let collection of collections) {
            sum += await Collectioning.getCollectionLength(user, collection.title);
          }
        }
        categories.push((await Collectioning.getCollectionLength(user, category)) + sum);
      }
      return await Summarizing.updateSummary(user, categories);
    }
  }

  @Router.patch("/collections/remove")
  async removeFromCollection(session: SessionDoc, collectionTitle: string, post: ObjectId) {
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      await Collectioning.removeFromCollection(user, collectionTitle, post);
      const defaultCategories = ["Lifestyle", "HealthAndFitness", "Entertainment", "FoodAndCooking", "FashionAndBeauty", "EducationAndDIY"];
      let categories = new Array<number>();
      for (let category of defaultCategories) {
        const collections = await Collectioning.getUserCollections(user);
        let sum = 0;
        if (!(collections instanceof NotFoundError)) {
          for (let collection of collections) {
            sum += await Collectioning.getCollectionLength(user, collection.title);
          }
        }
        categories.push((await Collectioning.getCollectionLength(user, category)) + sum);
      }
      return await Summarizing.updateSummary(user, categories);
    }
  }

  @Router.patch("/collections")
  async updateCollectionDeadline(session: SessionDoc, collectionTitle: string, deadline: string) {
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      return await Collectioning.updateCollectionDeadline(user, collectionTitle, deadline);
    }
  }

  @Router.get("/level/:user")
  async getLevel(user: string) {
    const userId = (await Authing.getUserByUsername(user))._id;
    if (!userId) return await Leveling.getLvl(userId);
    else return { msg: user + "not found!" };
  }

  @Router.get("/level/exp/:user")
  async getExp(user: string) {
    const userId = (await Authing.getUserByUsername(user))._id;
    if (!userId) return await Leveling.getExp(userId);
    else return { msg: user + "not found!" };
  }

  @Router.post("/summary/explore")
  /**
   * Given a user, recommends a category of content for the user by returning a category in which the user has
   * the least amount of saved posts.
   */
  async recommendContent(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    if ((await Authing.getUserRole(user)) === Role.RegularUser) {
      const category = Summarizing.findLowActivityCategory(user);
      const idx = await category;
      return IndexToCategory[idx];
    }
  }

  @Router.get("/summary")
  async getSummary(user: string) {
    const userId = (await Authing.getUserByUsername(user))._id;
    if ((await Authing.getUserRole(userId)) === Role.RegularUser) {
      return await Summarizing.getSummary(userId);
    }
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);

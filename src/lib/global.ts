import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import * as dotenv from "dotenv";
import jsonwebtoken  from 'jsonwebtoken';
import type { AuthResult, Product, SiteMessage, UserInfo } from "./types";
dotenv.config();

// Utils
export function formatPrice(price: number): string {
    let output = `£${price.toFixed(2)}`
    console.log(output);
    return output;
}

// Database
export async function createDB() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PWD,
        database: process.env.DB_NAME
    });
}

export async function getProductData(id: number): Promise<Product> {
    let conn = await createDB();
    let product: Product;
    
    try {
        const result = await conn.query(`SELECT * FROM Products WHERE id=?`, id);
        
        product = (result as RowDataPacket)[0][0] as Product;
        
        if (!product) {
            return null;
        }

        product.price = product.price / 100;
    } catch (e) {
        console.log(e);
    } finally {
        conn.end();
    }
    return product;
}

export async function getTrending(): Promise<Array<Product>> {
    let conn = await createDB();
    let list: Array<Product>;

    try {
        const result = await conn.query(`SELECT * FROM Products WHERE !sold ORDER BY clicks DESC LIMIT 3`);

        list = (result as RowDataPacket)[0]

        if (!list)
            return null;

        list.forEach((prod) => {
            prod.price = prod.price / 100;
        });
    } catch (e) {
        console.log(e);
    } finally {
        conn.end();
    }

    return list;
}

export async function getNewIn(): Promise<Array<Product>> {
    let conn = await createDB();
    let list: Array<Product>;

    try {
        const result = await conn.query(`SELECT * FROM Products WHERE !sold ORDER BY listed DESC LIMIT 3`);

        list = (result as RowDataPacket)[0]

        if (!list)
            return null;

        list.forEach((prod) => {
            prod.price = prod.price / 100;
        });
    } catch (e) {
        console.log(e);
    } finally {
        conn.end();
    }

    return list;
}

export async function getAll(type: number, priceFilter: string, showSold: boolean = false): Promise<Array<Product>> {
    let conn = await createDB();
    let list: Array<Product>;

    let typeQuery = "";
    if (type && !isNaN(type)) {
        typeQuery = (!showSold ? "&&" : "") + "type = " + type + " ";
    }

    let priceQuery = "listed DESC";
    if (priceFilter) {
        if (priceFilter == "high") priceQuery = "price DESC";
        else if (priceFilter == "low") priceQuery = "price";
        else if (priceFilter == "id") priceQuery = "id";
    }

    try {
        const result = await conn.query(`SELECT * FROM Products ` + (!showSold ? `WHERE !sold ` : ``) + typeQuery + `ORDER BY ` + priceQuery);

        list = (result as RowDataPacket)[0]

        if (!list)
            return null;

        list.forEach((prod) => {
            prod.price = prod.price / 100;
        });
    } catch (e) {
        console.log(e);
    } finally {
        conn.end();
    }

    return list;
}

export async function updateProductData(p: Product): Promise<boolean> {
    let conn = await createDB();

    try {
        await conn.query(
            `UPDATE Products SET type = ?, rent = ?, newlyBuilt = ?, address = ?, description = ?, coverimage = ?, images = ?, price = ?, bedrooms = ?, bathrooms = ?, receptions = ?, garden = ?, pets = ?, pets_info = ?, sold = ? WHERE id = ?`, 
            [p.type, p.rent, p.newlyBuilt, p.address, p.description, p.coverimage, JSON.stringify(p.images), p.price, p.bedrooms, p.bathrooms, p.receptions, p.garden, p.pets, p.pets_info, p.sold, p.id]
        );

        return true;
    } catch (e) {
        console.log(e);
        return false;
    } finally {
        conn.end();
    }
}

export async function createProductData(p: Product): Promise<boolean> {
    let conn = await createDB();

    try {
        await conn.query(
            `INSERT INTO Products (type, rent, newlyBuilt, address, description, coverimage, images, price, bedrooms, bathrooms, receptions, garden, pets, pets_info, sold) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
            [p.type, p.rent, p.newlyBuilt, p.address, p.description, p.coverimage, JSON.stringify(p.images), p.price, p.bedrooms, p.bathrooms, p.receptions, p.garden, p.pets, p.pets_info, p.sold]
        );

        return true;
    } catch (e) {
        console.log(e);
        return false;
    } finally {
        conn.end();
    }
}

export async function checkToken(token: string): Promise<AuthResult> {
    if (token == null) {
        return {
            result: "notoken",
            id: null,
            admin: null
        };
    }

    let id;
    let admin;
    await jsonwebtoken.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            id = null;
            admin = null;
        } else {
            id = decoded.id;
            admin = decoded.admin;
        }    
    });

    if (id == null) {
        return {
            result: "invalid",
            id: null,
            admin: null
        };
    } else {
        return {
            result: "ok",
            id: id,
            admin: admin
        };
    }
}

export async function getUserInfo(id: number): Promise<UserInfo> {
    let conn = await createDB();
    let user: UserInfo;
    
    try {
        const result = await conn.query(`SELECT id, admin, email, firstname, lastname, saved FROM Users WHERE id=?`, id);
        
        user = (result as RowDataPacket)[0][0] as UserInfo;
        
        if (!user) {
            return null;
        }
    } catch (e) {
        console.log(e);
    } finally {
        conn.end();
    }
    return user;
}

export async function userUpdateSaved(info: UserInfo): Promise<boolean> {
    let conn = await createDB();

    try {
        await conn.query(`UPDATE Users SET saved = ? WHERE id = ?`, [JSON.stringify(info.saved), info.id]);

        return true;
    } catch (e) {
        console.log(e);
        return false;
    } finally {
        conn.end();
    }
}

export async function getSiteMessage(): Promise<SiteMessage> {
    let conn = await createDB();
    let msg: SiteMessage;
    
    try {
        const result = await conn.query(`SELECT sitemessage_text, sitemessage_type FROM Admin WHERE id=1`);
        
        msg = (result as RowDataPacket)[0][0] as SiteMessage;
        
        if (!msg) {
            return null;
        }
    } catch (e) {
        console.log(e);
    } finally {
        conn.end();
    }
    return msg;
}
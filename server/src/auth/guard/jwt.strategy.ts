//  ----- 📖 Library 📖 -----
import { UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

//  ----- ➕ Interfaces ➕ -----
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { AuthService } from '@/src/auth/auth.service';

//  📤 export 📤 : extents PassportStrategy to JwtStrategy
export class JwtStrategy extends PassportStrategy(Strategy) {
  //  💪 constructor function
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //  📩 get jwt from header bearer
      ignoreExpiration: true, //  ⌚ expires token ignore or check (ignore : true | check : false)
      secretOrKey: process.env.JWT_SECRET || '', //  🔑 jwt key
    });
  }
  //  function : return to req
  validate(jwtPayloadData: JwtPayloadData): JwtPayloadData {
    // Check token expiration
    // Check if the token has expired
    if (typeof jwtPayloadData.exp !== 'undefined') {
      if (jwtPayloadData.exp < Date.now() / 1000) {
        throw new UnauthorizedException('Token has expired');
      }
    }

    const data: JwtPayloadData = {
      UserID: jwtPayloadData.UserID,
      SECCD: jwtPayloadData.SECCD,
    };
    global.jwtPayload = data;
    return data;
  }
}
